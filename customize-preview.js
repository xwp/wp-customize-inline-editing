/*global jQuery, wp, _CustomizeInlineEditingPreview_exports */
/*exported CustomizeInlineEditingPreview */
var CustomizeInlineEditingPreview = ( function ( $, api ) {
	'use strict';
	var self, OldPreview;

	self = {
		settingElementSelectors: {},
		preview: {},
		l10n: {
			shiftClickNotice: ''
		}
	};
	$.extend( self, _CustomizeInlineEditingPreview_exports );
	window._CustomizeInlineEditingPreview_exports = null;

	/*
	 * Capture the instance of the Preview since it is private
	 * @todo The need for doing this in the preview should also have been done in https://core.trac.wordpress.org/ticket/27666
	 */
	OldPreview = api.Preview;
	api.Preview = OldPreview.extend( {
		initialize: function( params, options ) {
			self.preview = this;
			OldPreview.prototype.initialize.call( this, params, options );
		}
	} );

	/**
	 *
	 * @param element
	 * @param settingName
	 */
	self.startEditing = function ( element, settingName ) {
		var el = $( element );
		if ( el.hasClass( 'customize-inline-editing' ) ) {
			return;
		}

		el.on( 'blur', { settingName: settingName }, function () {
			self.stopEditing( element, settingName );
		} );
		el.addClass( 'customize-inline-editing' );
		el.attr( 'contentEditable', 'true' );
		el.on( 'input keypress change', { settingName: settingName }, self.inputElement );
		el.focus();
	};

	/**
	 *
	 * @param settingName
	 * @param value
	 */
	self.inputElement = function ( e ) {
		var value = $( this ).text();
		self.preview.send( 'inline-editing-setting', {
			name: e.data.settingName,
			value: value
		} );
	};

	/**
	 *
	 * @param element
	 * @param settingName
	 */
	self.stopEditing = function ( element, settingName ) {
		var el = $( element );
		$( element ).removeClass( 'customize-inline-editing' );
		el.attr( 'contentEditable', 'false' );
		el.text( el.text() ); // strip out any markup added
		el.off( 'input keypress change', self.inputElement );
		self.preview.send( 'inline-editing-stop', { name: settingName } );
	};

	/**
	 *
	 * @param {jQuery.Event} e
	 */
	self.clickElement = function ( e ) {
		var el = $( this );
		if ( e.shiftKey || el.hasClass( 'customize-inline-editing' ) ) {
			e.preventDefault();
			e.stopPropagation(); // prevent click.preview on body from firing in customize-preview.js
			if ( ! el.hasClass( 'customize-inline-editing' ) ) {
				self.startEditing( el, e.data.settingName );
			}
		}
	};

	/**
	 * Set up CustomizeInlineEditingPreview upon DOM ready.
	 */
	self.init = function () {
		$.each( self.settingElementSelectors, function ( settingName, selector ) {
			if ( api( settingName ) ) {
				$( selector )
					.on( 'click', { settingName: settingName }, self.clickElement )
					.prop( 'title', self.l10n.shiftClickNotice );
			}
		} );

	};

	$( function () {
		self.init();
	} );

	return self;
}( jQuery, wp.customize ) );
