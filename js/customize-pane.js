/*global jQuery, wp */
/*exported CustomizeInlineEditingPane */
var CustomizeInlineEditingPane = ( function( $, api ) {
	'use strict';

	var component = {
		data: {
			inline_editable_settings: []
		}
	};

	/**
	 * Init.
	 *
	 * @param {object} data Data.
	 * @returns {void}
	 */
	component.init = function( data ) {
		if ( data ) {
			_.extend( component.data, data );
		}
		api.bind( 'ready', component.ready );
	};

	/**
	 * Ready.
	 *
	 * @returns {void}
	 */
	component.ready = function ready() {
		api.previewer.bind( 'setting', component.receiveSettingMessage );
	};

	/**
	 * Listen for setting changes related to inline editing.
	 *
	 * @param {Array} args Args.
	 * @returns {void}
	 */
	component.receiveSettingMessage = function receiveSettingMessage( args ) {
		var settingId = args[0], value = args[1];
		if ( api.has( settingId ) && -1 !== component.data.inline_editable_settings.indexOf( settingId ) ) {
			api( settingId ).set( value );
		}
	};

	return component;
} )( jQuery, wp.customize );
