/*global jQuery, wp */
/*exported CustomizeInlineEditingPreview */
var CustomizeInlineEditingPreview = ( function( $, api ) {
	'use strict';

	var component = {};

	/**
	 * Init.
	 *
	 * @returns {void}
	 */
	component.init = function init() {

		/*
		 * Hackily prevent core themes and other themes from binding event handlers
		 * to core setting changes which cause instant previews of the title and
		 * tagline. These are handled by the inline_editable partial instead.
		 */
		api.Value.prototype.bind = (function( wrappedBind ) {
			return function() {
				if ( ( 'blogname' === this.id || 'blogdescription' === this.id ) && /(\$|jQuery)\(.+?\.text\(/.test( arguments[0].toString() ) ) {
					return this;
				}
				return wrappedBind.apply( this, arguments );
			};
		})( api.Value.prototype.bind );

		api.bind( 'preview-ready', component.ready );
	};

	/**
	 * Ready.
	 *
	 * @returns {void}
	 */
	component.ready = function ready() {
		console.info( 'ready' );
	};

	return component;
} )( jQuery, wp.customize );
