/* global wp */
/* eslint consistent-this: [ "error", "partial" ], no-magic-numbers: [ "error", { "ignore": [-1,0,1] } ], complexity: [ "error", 4 ] */

wp.customize.selectiveRefresh.partialConstructor.inline_editable = (function( api, $ ) {
	'use strict';

	/**
	 * A partial for managing an inline-editable element.
	 *
	 * @class
	 * @augments wp.customize.Section
	 * @augments wp.customize.Class
	 */
	return api.selectiveRefresh.Partial.extend({

		/**
		 * Constructor.
		 *
		 * @inheritDoc
		 *
		 * @param {string} id - Partial ID.
		 * @param {Object} options - Options.
		 */
		initialize: function initialize( id, options ) {
			var partial = this;
			partial.placementEditShortcuts = [];
			partial.editingState = new api.Value();
			partial.editingState.validate = function( state ) { // eslint-disable-line complexity
				var validState = 'editable' === state || 'edited' === state || 'refreshing' === state || 'rendered' === state;
				if ( ! validState ) {
					throw new Error( 'Unexpected state: ' + state );
				}
				return state;
			};
			partial.editingState.set( 'rendered' );
			partial.editingLocked = false;

			api.selectiveRefresh.Partial.prototype.initialize.call( partial, id, options );
		},

		/**
		 * Find the current (active) placement, or else the first one.
		 *
		 * Current placements are those which have containers which contain the active (focused) element in the document.
		 *
		 * @returns {wp.customize.selectiveRefresh.Placement} Current placement.
		 */
		findCurrentPlacement: function findCurrentPlacement() {
			var partial = this, currentPlacement, placements;
			placements = partial.placements();
			if ( document.activeElement ) {
				currentPlacement = _.find( placements, function( placement ) {
					return placement.container.is( document.activeElement ) || $.contains( placement.container[0], document.activeElement );
				} );
			}
			if ( ! currentPlacement ) {
				currentPlacement = _.first( placements );
			}
			return currentPlacement;
		},

		/**
		 * Show the control to modify this partial's setting(s).
		 *
		 * @returns {void}
		 */
		showControl: function showControl() { // eslint-disable-line complexity
			var partial = this, primarySetting;

			// Handle condition where user clicks edit icon to mark editing as done.
			if ( partial.justFinalized ) {
				return;
			}

			// Show the control in the pane if the partial is currently refreshing.
			if ( 'refreshing' === partial.editingState.get() ) {
				api.selectiveRefresh.Partial.prototype.showControl.call( partial );
				return;
			}

			// Short-circuit if already editing.
			if ( 'editable' === partial.editingState.get() || 'edited' === partial.editingState.get() ) {
				return;
			}

			partial.currentInlineEditedPlacement = partial.findCurrentPlacement();

			// If there is no placement (unlikely) then fall back to focus on control.
			if ( ! partial.currentInlineEditedPlacement ) {
				api.selectiveRefresh.Partial.prototype.showControl.call( partial );
				return;
			}

			partial.currentInlineEditedPlacement.editShortcut = $( partial.currentInlineEditedPlacement.container.find( '.customize-partial-edit-shortcut:first' ) );

			partial.currentInlineEditedPlacement.editShortcut.find( 'path.edit' ).hide();
			partial.currentInlineEditedPlacement.editShortcut.find( 'path.done' ).show();

			partial.editingState.set( 'editable' );

			primarySetting = api( partial.params.primarySetting );

			// @todo Inherit all styles. all: inherit?
			partial.currentInlineEditedPlacement.editContainer = $( '<span></span>', {
				contentEditable: 'true',
				text: primarySetting.get() // @todo Use HTML when rich text.
			} );
			partial.currentInlineEditedPlacement.editContainer.css( {
				minHeight: '1em',
				minWidth: '1ex',
				display: 'inline-block'
			} );

			partial.currentInlineEditedPlacement.removedNodesFragment = partial.removeChildren( partial.currentInlineEditedPlacement );
			partial.currentInlineEditedPlacement.container.append( partial.currentInlineEditedPlacement.editContainer );

			partial.currentInlineEditedPlacement.container.on( 'click.customize-inline-editing-partial', function handleClick( event ) {
				event.preventDefault();
				event.stopPropagation(); // Currently needed for click.prevent event handler. TODO: Core should check if event.isDefaultPrevented().
			} );

			partial.currentInlineEditedPlacement.editContainer.on( 'input.customize-inline-editing-partial', function handleInput() {
				var value = partial.currentInlineEditedPlacement.editContainer.text();

				// Note that setting the value will not cause a selective refresh due to short-circuit in refresh method during inline editing.
				partial.editingState.set( 'edited' );
				primarySetting.set( value );

				/*
				 * Send the setting value to the parent window so that it will
				 * be saved into the changeset and be able to be published.
				 * Normally settings are only synced from the controls into the preview
				 * and not the other way around. For inline editing, however, setting
				 * changes can be made in the preview and they then need to be synced
				 * back up to the controls pane. This is an implementation of #29288:
				 * Settings updated within the Customizer Preview are not synced up to main app Panel
				 * https://core.trac.wordpress.org/ticket/29288
				 */
				api.preview.send( 'setting', [ primarySetting.id, value ] );
			} );

			// @todo Prevent blur when clicking on the edit shortcut to finalize.
			partial.currentInlineEditedPlacement.editContainer.on( 'blur.customize-inline-editing-partial', function handleBlur() {
				partial.finishInlineEditing();
			} );

			partial.currentInlineEditedPlacement.editContainer.on( 'keydown.customize-inline-editing-partial', function handleKeydown( event ) {
				var enterKey = 13, escKey = 27;

				// @todo Allow enter key if rich text allowed.
				// @todo Disallow rich formatting shortcuts if rich text is not allowed?
				if ( enterKey === event.keyCode || escKey === event.keyCode ) {
					event.preventDefault(); // Prevent newline.
					partial.finishInlineEditing();
				}
			} );

			partial.currentInlineEditedPlacement.editContainer.focus();
		},

		/**
		 * Remove all child nodes except for the edit shortcut.
		 *
		 * @param {wp.customize.selectiveRefresh.Placement} placement Placement.
		 * @returns {DocumentFragment} Fragment containing the removed nodes.
		 */
		removeChildren: function removeChildren( placement ) {
			var containerElement = placement.container[0], fragment = document.createDocumentFragment(), node;
			while ( containerElement.lastChild && ! $( containerElement.lastChild ).is( '.customize-partial-edit-shortcut' ) ) {
				node = containerElement.removeChild( containerElement.lastChild );
				fragment.insertBefore( node, fragment.firstChild );
			}
			return fragment;
		},

		/**
		 * Finish inline editing.
		 *
		 * Finalize the inline editing mode initialized by `showControl`.
		 *
		 * @returns {void}
		 */
		finishInlineEditing: function finishInlineEditing() {
			var partial = this, delayMs;

			// Short-circuit if not in an editable or edited state.
			if ( 'refreshing' === partial.editingState.get() || 'rendered' === partial.editingState.get() ) {
				return;
			}

			// @todo This is hacky.
			// Lock flag for preventing clicking on edit shortcut (to mark as done) from causing edit mode to be immeditely re-enabled.
			delayMs = 100; // eslint-disable-line no-magic-numbers
			partial.justFinalized = true;
			_.delay( function() {
				partial.justFinalized = false;
			}, delayMs );

			// Remove events.
			partial.currentInlineEditedPlacement.container.off( 'click.customize-inline-editing-partial' );
			partial.currentInlineEditedPlacement.editContainer.off( 'input.customize-inline-editing-partial' );
			partial.currentInlineEditedPlacement.editContainer.off( 'blur.customize-inline-editing-partial' );
			partial.currentInlineEditedPlacement.editContainer.off( 'keydown.customize-inline-editing-partial' );
			partial.currentInlineEditedPlacement.editContainer.attr( 'contentEditable', 'false' );
			partial.currentInlineEditedPlacement.editShortcut.find( 'path.edit' ).show();
			partial.currentInlineEditedPlacement.editShortcut.find( 'path.done' ).hide();

			// Replace the edit container with the removed nodes if it is not dirty (no changes were made).
			if ( 'edited' !== partial.editingState.get() ) {
				partial.currentInlineEditedPlacement.editContainer.remove();
				partial.currentInlineEditedPlacement.container.append( partial.currentInlineEditedPlacement.removedNodesFragment );
				partial.currentInlineEditedPlacement = null;

				// No need to do anything since no change was made.
				partial.editingState.set( 'rendered' );
				partial.editingLocked = false;
				return;
			}

			partial.currentInlineEditedPlacement = null;
			partial.editingState.set( 'refreshing' );
			partial.refresh().always( function() {
				partial.editingState.set( 'rendered' );
				partial.editingLocked = false;
			} );
		},

		/**
		 * Request the new partial and render it into the placements.
		 *
		 * @returns {jQuery.Promise} Refresh promise.
		 */
		refresh: function refresh() {
			var partial = this, setting = api( partial.params.primarySetting );

			// Apply instant previews, except when a placement is currently being inline-edited (since it would already be updated).
			_.each( partial.placements(), function( placement ) {
				if ( ! partial.currentInlineEditedPlacement || ! placement.container.is( partial.currentInlineEditedPlacement.container ) ) {
					partial.removeChildren( placement );
					placement.container.append( setting.get() );
				}
			} );

			if ( 'edited' === partial.editingState.get() ) {
				return $.Deferred().reject( 'inline_editing' ).promise();
			}

			return api.selectiveRefresh.Partial.prototype.refresh.call( partial );
		},

		/**
		 * Create an edit shortcut button for this partial.
		 *
		 * Augments normal edit shortcut with additional checkmark path for displaying while inline editing.
		 *
		 * @returns {jQuery} The edit shortcut button element.
		 */
		createEditShortcut: function createEditShortcut() {
			var partial = this, editShortcut, editPath, donePathElement;

			editShortcut = api.selectiveRefresh.Partial.prototype.createEditShortcut.call( partial );

			editPath = editShortcut.find( 'path' );
			editPath.addClass( 'edit' );

			// Taken from https://raw.githubusercontent.com/WordPress/dashicons/master/svg/yes.svg
			donePathElement = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
			donePathElement.setAttribute( 'class', 'done' );
			donePathElement.setAttribute( 'd', 'M14.83 4.89l1.34 0.94-5.81 8.38h-1.34l-3.24-4.54 1.34-1.25 2.57 2.4z' );
			$( donePathElement ).hide(); // To be shown when editing.
			editPath.after( donePathElement );

			// Show control in panel when double-clicking. @todo Also add support for longpress.
			editShortcut.on( 'dblclick', function() {
				api.selectiveRefresh.Partial.prototype.showControl.call( partial );
			} );

			return editShortcut;
		}
	});

})( wp.customize, jQuery );
