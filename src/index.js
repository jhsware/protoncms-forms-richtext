require('./actions/link');
require('./actions/unlink');
require('./actions/ul-list');
require('./widgets/PodcastWidget');
require('./widgets/YoutubeWidget');
require('./widgets/SimpleTableWidget');

// Use this to get up and running quickly
module.exports.BasicRichEditorWidget = require('./RichEditorWidget');

// This to render widgets on a page
module.exports.RichTextRenderMixin = require('./RichTextRenderMixin');

// Use these to create a custom rich text editor widget (you would normally do that)
module.exports.RichEditorWidgetMixin = require('./RichEditorWidgetMixin');
module.exports.MediumEditor = require('./MediumEditor');
module.exports.FormattingToolbar = require('./Formatting').FormattingToolbar;
module.exports.FormattingButton = require('./Formatting').FormattingButton;
module.exports.InsertActionButton = require('./Formatting').InsertActionButton;
module.exports.WidgetButton = require('./Formatting').WidgetButton;