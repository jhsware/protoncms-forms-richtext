'use strict';
var React = require('react');
var $ = require('jquery');
var IRichTextWidget = require('./interfaces').IRichTextWidget;
var cheerio = require('cheerio');

module.exports = {
    
    injectWidgetHTML: function (body, widgets) {
        
        // If we don't get any widgets we just return the body as is
        if (!widgets) {
            return body;
        }
        
        var $body = cheerio.load(body, { decodeEntities: false }); // Don't convert non-ascii characters to HTML entities
        
        for (var key in widgets) {
            // Get the widget
            var widget = widgets[key];
            
            // Get the widget utility
            try {
                var widgetUtil = registry.getUtility(IRichTextWidget, widget.utilityName);
                var ViewComponent = widgetUtil.ReactComponent;
                
                // Render widget HTML. NOTE: This is to allow spiders to get the full html, and also to get immediate rendering of the DOM-tree
                // avoiding delay until componentDidMount is called due to the size of the JS-file to be executed. renderToStaticMarkup rather
                // than renderToString which avoid data-reactid mismarch (server uses random values, client increments from zero).
                var widgetHTML = React.renderToStaticMarkup(<ViewComponent context={widget.data} widgetId={widget.widgetId} editor={this} />);

                // Now inject the widget
                $body("#" + widget.widgetId).html(widgetHTML);
            } catch (e) {
                console.log("[RichText] We couldn't find and/or mount the widget: " + widget.utilityName + " (#" + widget.widgetId + ")");
                console.log(e);
            }
        }
        return $body.html();
    },
    
    mountWidgets: function (el, widgets) {
        // IMPORTANT! Mount all widgets explicitly since they are disconnected from rest of app
        for (var key in widgets) {
            // Get the widget
            var widget = widgets[key];
            var $widget = $(el).find("#" + widget.widgetId);
            
            // Get the widget utility
            try {
                var widgetUtil = registry.getUtility(IRichTextWidget, widget.utilityName);
                var ViewComponent = widgetUtil.ReactComponent;
                React.render(<ViewComponent context={widget.data} widgetId={widget.widgetId} editor={this} />, $widget[0]);
            } catch (e) {
                console.log("[RichText] We couldn't find and/or mount the widget: " + widget.utilityName + " (#" + widget.widgetId + ")");
                console.log(e);
            }
            
        }
    },
    
    unmountWidgets: function (el, widgets) {
        // IMPORTANT! Unmount all widgets explicitly since they are disconnected from rest of app
        for (var key in widgets) {
            // Get the widget
            var widget = widgets[key];
            var $widget = $(el).find("#" + widget.widgetId);
            
            // Get the widget utility
            try {
                React.unmountComponentAtNode($widget[0]);
            } catch (e) {
                console.log("[RichText] We couldn't unmount the widget: " + widget.utilityName + " (#" + widget.widgetId + ")");
                console.log(e);
            }
            
        };
    },
}