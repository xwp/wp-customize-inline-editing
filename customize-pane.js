/*global jQuery, wp, _customizeInlineEditingPaneExports */
/*exported CustomizeInlineEditingPane */
var CustomizeInlineEditingPane = ( function( $, api ) {
	'use strict';

	var self = {};
	$.extend( self, _customizeInlineEditingPaneExports );
	window._customizeInlineEditingPaneExports = null;

	self.init = function() {

		// Listen for the preview sending updates for settings
		api.previewer.bind( 'inline-editing-setting', function( previewSetting ) {
			var setting = api( previewSetting.name );
			if ( setting ) {

				// Turn off refresh/postMessage transport so we don't clobber inline editing
				if ( 'inlineEditing' !== setting.transport ) {
					setting.originalTransport = setting.transport;
					setting.transport = 'inlineEditing';
				}
				setting.set( previewSetting.value );
			}
		} );

		// Reset setting transport when inline editing is over
		api.previewer.bind( 'inline-editing-stop', function( previewSetting ) {
			var setting = api( previewSetting.name );
			if ( setting ) {
				setting.transport = setting.originalTransport || 'refresh';

				/*
				 * When editing has finished, re-preview the change to ensure that
				 * any associated partials are refreshed so that the low-fidelity
				 * JS-supplied preview will be replaced with the actual high-fidelity
				 * PHP-rendered preview from the server. See #33738.
				 */
				if ( 'postMessage' === setting.transport ) {
					setting.preview();
				}
			}
		} );
	};

	api.bind( 'ready', function() {
		self.init();
	} );

	return self;
}( jQuery, wp.customize ) );
