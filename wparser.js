var fs = require('fs');
var args = require('system').args;
var urls = [];
var urlIndex = 0;
var allWebsitesData = [];
var attributes = [
    'url',
    'text',
    'html_elements',
    'headings',
    'paragraphs',
    'images',
    'font_families',
    'font_sizes',
    'links',
    'divs', 
    'ids',
    'classes',
    'css_external',
    'css_internal',
    'css_inline',
    'css_declaration_blocks',
    'css_prefixes',
    'js_sources', 
    'meta_tags',
    'has_meta_keywords',
    'has_meta_description',
    'rss',
    'import', 
    'twitter_bootstrap',
    'html5_tags',
    'html5',
    'css_transitions',
    'flash',
    'page_weight',
    'media_queries',
    'conditional_comments',
    'included_multimedia',
    'minified_css',
    'font_families_list',
    'h1_font', 
    'h2_font',
    'h3_font',
    'h4_font',
    'h5_font',
    'p_font',
    'a_font',
    'reset_css',
    'normalize_css',
    'css_pseudo_elements',
    'no_js'
]; // Need this to have an proper order of attributes

// TODO: Not implemented
// 'preprocessors', 'frameworks', 'cms_used', 'color_palette', 'colors'
// 'dominant_color', 'sprite_images'

function readCsvFile() {
    if (!args[1]) {
        console.log('Warning: Script should be called as: "phantomjs wparser.js test.csv".')
        phantom.exit(0);
    }

    if (!fs.exists(args[1])) {
        console.log('Warning: Given file does not exist.')
        phantom.exit(0);
    }

    var file_path = args[1];
    var file_h = fs.open(file_path, 'r');
    var line = file_h.readLine();

    urls.push(line);
    while(line) {
        line = file_h.readLine();
        urls.push(line);
    }

    file_h.close();
}

function writeCsvFile() {
    var content = '';
    var path = "output/output.csv";

    if (allWebsitesData.length === 0) {
        console.log('Warning: There is no content to write.')
        phantom.exit(0);
    }

    // headers
    for (var i=0; i<attributes.length; i++) {
        content += '"' + attributes[i] + '",';
    }
    content = content.substring(0, content.length - 1);

    // content
    for (var i=0; i<allWebsitesData.length; i++) {
        content += '\n';
        for (var j=0; j<attributes.length; j++) {
            content += '"' + allWebsitesData[i][attributes[j]] + '",';
        }
        content = content.substring(0, content.length - 1);
    }

    fs.write(path, content, 'w');
}

function handlePage(url) {
    var webPage = require('webpage');
    var page = webPage.create();
    var width = 1024,
        height = 768;

    page.viewportSize = { width: width, height: height };
    page.settings.javascriptEnabled = true;

    page.open(url, function(status) {
        if (status === 'success') {
            console.log('------------------------------------------');
            console.log('Processing: ' + url);
            console.log('------------------------------------------');

            page.injectJs('js-libs/jquery-2.1.1.min.js');

            // catches all messages outputed to the console
            page.onConsoleMessage = function(msg, line, source) {
                console.log('console> ' + msg);
            };

            var screenshotPath = 'screenshots/' + page.url.replace(/[^\w\s!?]/g,'') + '.png';

            if (!fs.exists(screenshotPath)) {
                page.render(screenshotPath, {format: 'png', quality: '100'});
            }

            var pageData = page.evaluate(function(handlePageData, page, attributes, screenshotPath) {
                var cssRequests = [];
                var cssContents = [];
                var pageData = {};

                function cssIsReachable(cssUrl) {
                    // TODO: How to deal with unreachable CSS files???
                    // TODO: Some urls are not reachable (cross-browser request)
                    // TODO: Maybe would make sense to completely avoid them

                    var shortPageUrl = page.url.substr(page.url.indexOf(".") + 1);

                    // url starts with http and if it contains page domain
                    if (cssUrl.indexOf('http') === 0 && cssUrl.indexOf(shortPageUrl) > -1) {
                        return true;
                    }

                    // url starts with one /
                    if (cssUrl.match(/^\/[a-zA-Z]/)) {
                        return true;
                    }

                    return false;
                }

                function endsWith(str, suffix) {
                    return str.indexOf(suffix, str.length - suffix.length) !== -1;
                }

                function getCleanCssUrl(cssUrl) {
                    var cssExtension = '.css';

                    // clear everything after '.css' - for example '.css.php?v3'
                    if ((cssUrl.indexOf(cssExtension) > -1) && (!endsWith(cssUrl, cssExtension))) {
                        cssUrl = cssUrl.substr(0, cssUrl.indexOf(cssExtension) + cssExtension.length);
                    }

                    return cssUrl;
                }

                // TODO: Add also custom css styles (which are under style tags) to cssContent
                $('link[rel="stylesheet"]').each(function() {
                    var cssUrl = $(this).attr('href');

                    if (cssIsReachable(cssUrl)) {
                        cssUrl = getCleanCssUrl(cssUrl);

                        var request = $.ajax({
                            type: "GET",
                            url: cssUrl,
                            cache: false,
                            crossDomain: true,
                            async: false,
                            xhrFields: {
                               withCredentials: true
                            }
                        });

                        cssRequests.push(request);
                    }
                });

                // after all requests for css files are finished, we continue with handling data from the page
                if (cssRequests.length > 0) {
                    $.when.apply($, cssRequests).done(function() {
                        $.map(arguments, function(arg) {
                            // sometimes response is received as string and sometimes as object
                            if (typeof(arg) === 'string') {
                                if (arg === 'success' || arg === 'error') {
                                    return '';
                                }

                                cssContents.push(arg);
                            } else if (typeof(arg) === 'object') {
                                if (arg['responseText']) {
                                    return arg['responseText'];
                                }

                                cssContents.push(arg[0]);
                            }
                        });
                    });
                }

                return handlePageData(page, cssContents, attributes, screenshotPath);
            }, handlePageData, page, attributes, screenshotPath);

            allWebsitesData.push(pageData);

            // give parser enough time to deal with one url
            setTimeout(nextPage, 10000);
        }
    });
}

/**
 * @param {Object} page
 * @param {array} cssContents
 * @param {array} attributes
 */
var handlePageData = function(page, cssContents, attributes, screenshotPath) {
    var pageData = {};
    var html = page.content;
    var cleanHtml = $(document.documentElement).clone().find("script,noscript,style,link,meta,head").remove().end().html();
    var css = cssContents.join();

    // initialize
    for (var i=0; i<attributes.length; i++) {
        pageData[attributes[i]] = null;
    }

    // helper functions
    function getFontFamilies() {
        var fontFamilies = [];

        $('body *').each(function() {
            var fontFamily = $(this).css('font-family');
            if (fontFamily && fontFamilies.indexOf(fontFamily) === -1) {
                fontFamilies.push(fontFamily);
            }
        });

        return fontFamilies;
    }

    // pageData
    pageData['url'] = page.url;

    pageData['text'] = $(cleanHtml).text().length;

    pageData['html_elements'] = $('*').length;

    pageData['headings'] = (function() {
        var headingsArray = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        var headings = headingsArray.join();

        return $(headings).length;
    }());

    pageData['paragraphs'] = $('p').length;

    pageData['images'] = $('img').length;

    pageData['font_families'] = getFontFamilies().length;

    pageData['font_sizes'] = (function() {
        var fontSizes = [];

        $('body *').each(function() {
            var fontSize = $(this).css('font-size');
            if (fontSize && fontSizes.indexOf(fontSize) === -1) {
                fontSizes.push(fontSize);
            }
        });

        return fontSizes.length;
    }());

    pageData['links'] = $('a').length;

    pageData['divs'] = $('div').length;

    pageData['ids'] = (function() {
        var ids = [];

        $('[id]').each(function() { 
            var id = $(this).attr('id');
            if (id && ids.indexOf(id) === -1) {
                ids.push(id);
            }
        });

        return ids.length;
    }());

    pageData['classes'] = (function() {
        var classes = [];

        $('[class]').each(function() { 
            var elClass = $(this).attr('class');
            if (elClass && classes.indexOf(elClass) === -1) {
                classes.push(elClass);
            }
        });

        return classes.length;
    }());

    pageData['css_external'] = $('link[type="text/css"]').length;

    pageData['css_internal'] = $('style').length;

    pageData['css_inline'] = $('[style]').length;

    pageData['css_declaration_blocks'] = (function() {
        if (!css) {
            return 0;
        }

        return css.split('{').length - 1;
    }());

    pageData['css_prefixes'] = (function() {
        var prefixes = ['-ms-', '-o-', '-webkit-', '-moz-'];

        for (var i=0; i<prefixes.length; i++) {
            if (css.indexOf(prefixes[i]) > -1) {
                return true;
            }
        }

        return false;
    }());

    pageData['js_sources'] = $('script[type="text/javascript"]').length;

    pageData['meta_tags'] = $('meta').length;

    pageData['has_meta_keywords'] = $('meta[name="keywords"]').length > 0;

    pageData['has_meta_description'] = $('meta[name="description"]').length > 0;

    pageData['rss'] = $('link[type="application/rss+xml"]').length > 0;

    // TODO: Don't know how
    /*pageData['preprocessors'] = page.evaluate(function() {
        return;
    });*/

    pageData['import'] = css.indexOf('@import') > -1;

    // TODO: Don't know how
    /*pageData['frameworks'] = page.evaluate(function() {
        return;
    });*/

    // TODO: Don't know how
    /*pageData['cms_used'] = page.evaluate(function() {
        return;
    });*/

    pageData['twitter_bootstrap'] = $('link[href*="bootstrap"]').length > 0;

    pageData['html5_tags'] = (function() {
        var html5TagsArray = [
            'section', 'nav', 'article', 'aside', 'header', 'footer', 'main', 'template', 'figure', 'figcaption',
            'data', 'time', 'mark', 'ruby', 'rt', 'rp', 'bdi', 'wbr', 'embed', 'video', 'audio', 'source', 'track',
            'canvas', 'svg', 'math', 'datalist', 'keygen', 'output', 'progress', 'meter', 'details', 'summary', 
            'menuitem', 'menu'];
        var html5Tags = html5TagsArray.join();

        return $(html5Tags).length;
    }());

    pageData['html5'] = pageData['html5_tags'] > 0;

    pageData['css_transitions'] = (function() {
        var transitions = ['transition:', 'transition-delay:', 'transition-duration:', 'transition-property:', 'transition-timing-function:'];

        for (var i=0; i<transitions.length; i++) {
            if (css.indexOf(transitions[i]) > -1) {
                return true;
            }
        }

        return false;
    }());

    pageData['flash'] = $('object[type="application/x-shockwave-flash"], embed[type="application/x-shockwave-flash"]').length > 0;

    // TODO: Not sure about this
    pageData['page_weight'] = (function() {
        var pageSize = $('html').html().length;
        var kb = (pageSize / 1024).toFixed(2);

        return kb;
    }());

    pageData['media_queries'] = (function() {
        if (css.indexOf('@media') > -1) {
            return true;
        }

        if ($('link[media]').length > 0) {
            return true;
        }

        return false;
    }());

    pageData['conditional_comments'] = html.indexOf('<!--[if') > -1;

    pageData['included_multimedia'] = $('video, embed, object, audio, source').length;

    // TODO: Don't know how
    //pageData['sprite_images'] = (function() {
        // TODO: Go throuh elements and look for values of some css attributes

        /*
        Detect something like this below. Background that includes url as the 1st argument and positions as 2nd and 3rd arguments.
        #next a:hover{background: url('img_navsprites_hover.gif') -91px -45px;}

        Also search just for background position.

        When using the shorthand property the order of the property values is:
        background-color
        background-image
        background-repeat
        background-attachment
        background-position

        Example: body {background:#ffffff url("img_tree.png") no-repeat right top;}*/
    //}());

    pageData['minified_css'] = (function() {
        for (var i=0; i<cssContents.length; i++) {
            var content = cssContents[i];

            // let's just say that if there's less than 10 characters, there's nothing meaningful
            if (content.split(/\r\n|\r|\n/).length === 1 && content.length > 10) {
                return true;
            }
        }
        
        return false;
    }());

    // check if length is larger then 0/1 and if there's more lines then ...

    pageData['font_families_list'] = getFontFamilies();

    pageData['h1_font'] = $('h1').css('font-family') ? $('h1').css('font-family') : '';

    pageData['h2_font'] = $('h2').css('font-family') ? $('h2').css('font-family') : '';

    pageData['h3_font'] = $('h3').css('font-family') ? $('h3').css('font-family') : '';

    pageData['h4_font'] = $('h4').css('font-family') ? $('h4').css('font-family') : '';

    pageData['h5_font'] = $('h5').css('font-family') ? $('h5').css('font-family') : '';

    pageData['p_font'] = $('p').css('font-family') ? $('p').css('font-family') : '';

    pageData['a_font'] = $('a').css('font-family') ? $('a').css('font-family') : '';

    pageData['reset_css'] = $('link[href*="reset.css"]').length > 0;

    pageData['normalize_css'] = $('link[href*="normalize.css"]').length > 0;

    pageData['css_pseudo_elements'] = css.indexOf('::') > -1;

    pageData['no_js'] = html.indexOf('class="no-js') > -1;

    return pageData;
}

function nextPage() {
    var url = urls[urlIndex];

    if (!url) {
        writeCsvFile();
        phantom.exit(1);
    }

    handlePage(url);

    urlIndex++;
}

readCsvFile();
nextPage();
