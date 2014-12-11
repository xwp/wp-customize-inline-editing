<?php
/**
 * Plugin Name: Customize Inline Editing
 * Description: Demonstration of how inline editing can be added to the Customizer.
 * Version: 0.1
 * Author: XWP, Weston Ruter
 * Author URI: https://xwp.co
 * License: GPLv2+
 */

/**
 * Copyright (c) 2014 XWP (https://xwp.co/)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2 or, at
 * your discretion, any later version, as published by the Free
 * Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

class Customize_Inline_Editing {

	/**
	 * Bootstrap
	 */
	function __construct() {
		add_action( 'customize_register', array( $this, 'register' ) );
	}

	/**
	 * Add necessary Customizer hooks if the theme supports inline-editing
	 */
	function register() {
		if ( ! $this->get_theme_support() ) {
			return;
		}
		add_action( 'customize_controls_enqueue_scripts', array( $this, 'enqueue_pane_scripts' ) );
		add_action( 'customize_preview_init', array( $this, 'preview_init' ) );
	}

	/**
	 * Grab the setting element selectors defined in the customize-inline-editing theme support,
	 * or provide fallback defaults for themes bundled with Core.
	 *
	 * @return array
	 */
	function get_theme_support() {
		$support = get_theme_support( 'customize-inline-editing' );
		if ( ! empty( $support ) ) {
			$setting_element_selectors = array_shift( $support );
		} else {
			$setting_element_selectors = array();
			if ( 'twentyten' === get_template() ) {
				$setting_element_selectors['blogname'] = '#branding a[rel=home]';
				$setting_element_selectors['blogdescription'] = '#site-description';
			} elseif ( 'twentyeleven' === get_template() ) {
				$setting_element_selectors['blogname'] = '#site-title a';
				$setting_element_selectors['blogdescription'] = '#site-description';
			} elseif ( 'twentytwelve' === get_template() ) {
				$setting_element_selectors['blogname'] = '.site-title a';
				$setting_element_selectors['blogdescription'] = '.site-description';
			} elseif ( 'twentythirteen' === get_template() ) {
				$setting_element_selectors['blogname'] = '.site-title';
				$setting_element_selectors['blogdescription'] = '.site-description';
			} elseif ( 'twentyfourteen' === get_template() ) {
				$setting_element_selectors['blogname'] = '.site-title a';
			} elseif ( 'twentyfifteen' === get_template() ) {
				$setting_element_selectors['blogname'] = '.site-title a';
				$setting_element_selectors['blogdescription'] = '.site-description';
			}
		}
		return $setting_element_selectors;
	}

	/**
	 * Add actions for Customizer preview
	 */
	function preview_init() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_preview_scripts' ) );
	}

	/**
	 * Enqueue scripts in panel
	 */
	function enqueue_pane_scripts() {
		$handle = 'customize-inline-editing-pane';
		$src = plugin_dir_url( __FILE__ ) . 'customize-pane.js';
		$deps = array( 'jquery', 'customize-controls' );
		wp_enqueue_script( $handle, $src, $deps );
		$data = array();
		$this->export_script_data( $handle, '_CustomizeInlineEditingPane_exports', $data );
	}

	/**
	 * Enqueue scripts in preview
	 */
	function enqueue_preview_scripts() {
		$handle = 'customize-inline-editing-preview';
		$src = plugin_dir_url( __FILE__ ) . 'customize-preview.js';
		$deps = array( 'jquery', 'customize-preview' );
		wp_enqueue_script( $handle, $src, $deps );
		$data = array(
			'settingElementSelectors' => $this->get_theme_support(),
			'l10n' => array(
				'shiftClickNotice' => __( 'Shift + Click to edit inline.', 'customize-inline-editing' ),
			),
		);
		$this->export_script_data( $handle, '_CustomizeInlineEditingPreview_exports', $data );
	}

	/**
	 * Export the given JSON-serializable $exported_data to JavaScript with name $exported_name.
	 *
	 * @param string $handle Script handle.
	 * @param string $exported_name Name of the variable that will be exported, such as 'foo' or 'bar.baz.qux'; gets prefixed by 'window.'
	 * @param mixed $exported_data JSON-serializable data
	 *
	 * @throws Exception when the supplied $exported_name is not valid JS
	 * @throws Exception when the $exported_data is not JSON-serializable
	 */
	function export_script_data( $handle, $exported_name, $exported_data ) {
		global $wp_scripts;
		$serialized = json_encode( $exported_data );
		$data = sprintf( 'window.%s = %s;', $exported_name, $serialized );
		$wp_scripts->add_data( $handle, 'data', $data );
	}
}

$customizer_inline_editing = new Customize_Inline_Editing();
