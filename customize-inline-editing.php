<?php
/**
 * Plugin Name: Customize Inline Editing
 * Description: Demonstration of how inline editing can be added to the Customizer.
 * Version: 0.2.0-alpha
 * Author: XWP, Weston Ruter
 * Author URI: https://make.xwp.co
 * License: GPLv2+
 *
 * Copyright (c) 2014-2017 XWP (https://make.xwp.co/)
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
 *
 * @package CustomizeInlineEditing
 */

/**
 * Class Customize_Inline_Editing
 */
class Customize_Inline_Editing {

	/**
	 * Bootstrap.
	 *
	 * @todo Refactor this.
	 */
	function __construct() {
		add_action( 'customize_controls_enqueue_scripts', array( $this, 'enqueue_pane_scripts' ) );
		add_action( 'customize_preview_init', array( $this, 'preview_init' ) );
		add_action( 'customize_register', array( $this, 'upgrade_partials' ), 100 );
	}

	/**
	 * Upgrade core partials to use inline editing.
	 *
	 * @global \WP_Customize_Manager $wp_customize
	 */
	function upgrade_partials() {
		global $wp_customize;
		$partials = array_filter( array(
			$wp_customize->selective_refresh->get_partial( 'blogname' ),
			$wp_customize->selective_refresh->get_partial( 'blogdescription' ),
		) );
		foreach ( $partials as $partial ) {
			if ( 'default' !== $partial->type ) {
				continue;
			}
			$partial->type = 'inline_editable';
		}
	}

	/**
	 * Add actions for Customizer preview.
	 */
	function preview_init() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_preview_scripts' ) );
	}

	/**
	 * Enqueue scripts in panel.
	 *
	 * @global \WP_Customize_Manager $wp_customize
	 */
	function enqueue_pane_scripts() {
		global $wp_customize;

		$handle = 'customize-inline-editing-pane';
		$src = plugin_dir_url( __FILE__ ) . 'js/customize-pane.js';
		$deps = array( 'jquery', 'customize-controls' );
		wp_enqueue_script( $handle, $src, $deps );

		$inline_editable_settings = array();
		foreach ( $wp_customize->selective_refresh->partials() as $partial ) {
			if ( 'inline_editable' === $partial->type ) {
				$inline_editable_settings = array_merge( $inline_editable_settings, $partial->settings );
			}
		}
		$data = compact( 'inline_editable_settings' );
		wp_add_inline_script( $handle, sprintf( 'CustomizeInlineEditingPane.init( %s );', wp_json_encode( $data ) ) );
	}

	/**
	 * Enqueue scripts in preview
	 */
	function enqueue_preview_scripts() {
		$handle = 'customize-inline-editable-partial';
		$src = plugin_dir_url( __FILE__ ) . 'js/customize-inline-editable-partial.js';
		$deps = array( 'customize-selective-refresh' );
		wp_enqueue_script( $handle, $src, $deps );

		$handle = 'customize-inline-editing-preview-theme-support-hack';
		$src = plugin_dir_url( __FILE__ ) . 'js/customize-preview-theme-support-hack.js';
		$deps = array( 'jquery', 'customize-preview' );
		wp_enqueue_script( $handle, $src, $deps );
	}
}

$customizer_inline_editing = new Customize_Inline_Editing();
