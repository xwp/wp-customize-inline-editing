=== Customize Inline Editing ===
Contributors: X-team, westonruter
Tags: customizer, customize, inline, editing
Requires at least: 4.0
Tested up to: 4.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Demonstration of how inline editing can be added to the Customizer.

== Description ==

It is surprisingly easy to add inline editing support to the Customizer. With inline
editing, the user no longer has to open a control in the left Customizer pane to edit
a setting. Instead, they can just click on the relevant element in the Customizer preview
and edit the item inline. It could be said that adding inline-editing to the Customizer
improves the UX so much over `postMessage` live editing, as `postMessage` is an improvement
over the `refresh` transport. There is no need to hunt for the right control,
and can actually edit with the Customizer pane *collapsed!* Here is a demonstration:

[youtube http://www.youtube.com/watch?v=1OA8MUI-364]

**Important:** This plugin is not intended to compete with [avryl](http://jannekevandorpe.com/)'s great [Front-end Editor plugin](http://wordpress.org/plugins/wp-front-end-editor/).
In fact, [she is re-writing her plugin to leverage the Customizer](https://github.com/avryl/wp-front-end-editor/issues/87#issuecomment-55146044).
This plugin is just a quick demonstration of how simple the Customizer can be extended to support
inline editing—moving the controls into the preview itself.

This plugin provides one example implementation of inline-editing this can be accomplished in the Customizer.

Themes can opt-in to support such inline-editing within the Customizer
by indicating the theme supports `customize-inline-editing` and then passing an array
Customizer setting names mapped to CSS selectors, similar to how most themes already
opt-in for `postMessage` transport:

<pre><code>
add_theme_support( 'customize-inline-editing', array(
	'blogname' => '.site-title a',
	'blogdescription' => '.site-description',
	// ...
) );
</code></pre>

The plugin is bundled with built-in support for the Core Twenty* themes, so you can
use the plugin with these themes as-is.

Hover over an element that is inline-editable and a tooltip appears:

> Shift + Click to edit inline.

Doing so turns the element into a `contentEditable` area. Any change to the text in this
element will be then synced up to the Customizer's setting model. Upon clicking out (blurring) of
the element, the `contentEditable` state is removed. The setting may still be edited via the
control in the Customizer pane as well.

Only basic text fields can currently be edited; styling and any tags added to `contentEditable` areas will be stripped out.

**Development of this plugin is done [on GitHub](https://github.com/x-team/wp-customize-inline-editing). Pull requests welcome. Please see [issues](https://github.com/x-team/wp-customize-inline-editing/issues) reported there before going to the [plugin forum](https://wordpress.org/support/plugin/customize-inline-editing).**

== Changelog ==

= 0.1 =
First release.
