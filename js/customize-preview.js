/*global jQuery, wp, _customizeInlineEditingPreviewExports */
/*exported CustomizeInlineEditingPreview */
var CustomizeInlineEditingPreview = ( function( $, api ) {
	'use strict';
	var self;

	self = {
		settingElementSelectors: {},
		l10n: {
			shiftClickNotice: ''
		}
	};
	$.extend( self, _customizeInlineEditingPreviewExports );
	window._customizeInlineEditingPreviewExports = null;

	/**
	 * Start inline editing.
	 *
	 * @param {jQuery} element
	 * @param {string} settingName
	 */
	self.startEditing = function( element, settingName ) {
		var el = $( element );
		if ( el.hasClass( 'customize-inline-editing' ) ) {
			return;
		}

		el.on( 'blur', { settingName: settingName }, function() {
			self.stopEditing( element, settingName );
		} );
		el.addClass( 'customize-inline-editing' );
		el.attr( 'contentEditable', 'true' );
		el.on( 'input keypress change', { settingName: settingName }, self.onInputElement );
		el.focus();
	};

	/**
	 * Handle changing input value.
	 *
	 * @param {jQuery.Event} e
	 */
	self.onInputElement = function( e ) {
		var value = $( this ).text();
		api.preview.send( 'inline-editing-setting', {
			name: e.data.settingName,
			value: value
		} );
	};

	/**
	 * Stop inline editing.
	 *
	 * @param {jQuery} element
	 * @param {string} settingName
	 */
	self.stopEditing = function( element, settingName ) {
		var el = $( element );
		$( element ).removeClass( 'customize-inline-editing' );
		el.attr( 'contentEditable', 'false' );
		el.text( el.text() ); // Strip out any markup added.
		el.off( 'input keypress change', self.onInputElement );
		api.preview.send( 'inline-editing-stop', { name: settingName } );
	};

	/**
	 * Handle clicking on an element.
	 *
	 * @param {jQuery.Event} e
	 */
	self.onClickElement = function( e ) {
		var el = $( this );
		if ( e.shiftKey || el.hasClass( 'customize-inline-editing' ) ) {
			e.preventDefault();
			e.stopPropagation(); // Prevent click.preview on body from firing in customize-preview.js
			if ( ! el.hasClass( 'customize-inline-editing' ) ) {
				self.startEditing( el, e.data.settingName );
			}
		}
	};

	/**
	 * Set up CustomizeInlineEditingPreview upon DOM ready.
	 */
	self.init = function() {
		$.each( self.settingElementSelectors, function( settingName, selector ) {
			if ( api( settingName ) ) {
				$( selector )
					.on( 'click', { settingName: settingName }, self.onClickElement )
					.prop( 'title', self.l10n.shiftClickNotice );
			}
		} );

	};

	$( function() {
		self.init();
	} );

	return self;
}( jQuery, wp.customize ) );
