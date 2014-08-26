# wparser

## About

This parser is built with PhantomJS and Python and it's basic functionality is to extract data from a received website. Parser can be runned as an python command and it accepts .csv file (with list of urls) as an input arguments. As an result, it builds an .csv file with a list of all the attributes and with received values for each given website. More technical explenation is given later below.

I've needed this parser to get the data which I'll need for my thesis. While I was working on it, I've decided to open source it so that maybe someone else can also find it useful or even contribute.
I doubt someone will find all those attributes useful but at least maybe you can get an idea of how to pull some specific data from websites.
I still didn't implement all the attributes that I've wanted, because for some of them I still didn't manage to find a solution.
Feel free to use this parser, contribute to it (by fixing or adding stuff), give me suggestions for refactoring, better implementation or whatever else you want.

## List of attributes

* url
    - type: string
    - Website url
* text
    - type: number
    - Overall amount of text
* html_elements
    - type: number
    - Number of all HTML elements used on a website
* headings
    - type: number
    - Number of headings (`<h1>`, `<h2>` etc)
* paragraphs
    - type: number
    - Number of `<p>` HTML tags used on website
* images
    - type: number
    - Number of images included with `<img>` tag
* font_families
    - type: number
    - Number of all font families used on a website
* font_sizes
    - type: number
    - Number of font sizes (assigned with pixels, % and em - as one of the most used) used on a website
* links
    - type: number
    - Number of links used on a website
* divs
    - type: number
    - Number of div HTML tags used on a website
* ids
    - type: number
    - Number of id attributes in HTML code
* classes
    - type: number
    - Number of class attributes in HTML code
* css_external
    - type: number
    - Number of external CSS sources (seperate CSS files)
* css_internal
    - type: number
    - Number of internal CSS sources (under `<style>` tags)
* css_inline
    - type: number
    - Number of inline CSS definitions (under style attribute)
* css_declaration_blocks
    - type: number
    - Number of CSS declaration blocks
* css_prefixes
    - type: boolean
    - Whether website is using experimental CSS (browser prefixes etc)
* js_sources
    - type: number
    - Number of all JavaScript sources
* meta_tags
    - type: number
    - Number of meta tags in the `<head>` of HTML file
* has_meta_keywords
    - type: boolean
    - Check if website has any meta keywords 
* has_meta_description
    - type: boolean
    - Check if website has any meta description
* rss
    - type: boolean
    - Check whether website is using RSS or not
* import
    - type: boolean
    - Check if there is `@import` rule used in CSS source code
* twitter_bootstrap
    - type: boolean
    - Check whether Twitter Bootstrap is used
* html5
    - type: boolean
    - Check whether HTML5 tags are used
* html5_tags
    - type: number
    - Number of used HTML5 tags
* css_transitions
    - type: boolean
    - Check whether CSS transitions are used
* flash
    - type: boolean
    - Detect whether Flash is used
* page_weight
    - type: number
    - Web page weight in kb
* media_queries
    - type: boolean
    - Check whether media queries are used
* conditional_comments
    - type: boolean
    - Check whether conditional comments in CSS are used
* included_multimedia
    - type: boolean
    - Check if there is included multimedia (video, audio etc.)
* minified_css
    - type: boolean
    - Detect whether any of CSS files are minified
* font_families_list
    - type: string
    - List of all used font families
* h1_font
    - type: string
    - Font used for `<h1>` element
* h2_font
    - type: string
    - Font used for `<h2>` element
* h3_font
    - type: string
    - Font used for `<h3>` element
* h4_font
    - type: string
    - Font used for `<h4>` element
* h5_font
    - type: string
    - Font used for `<h5>` element
* p_font
    - type: string
    - Font used for `<p>` element
* a_font
    - type: string
    - Font used for `<a>` element
* reset_css
    - type: boolean
    - Check whether reset.css is used
* normalize_css
    - type: boolean
    - Check whether normalize.css is used
* css_pseudo_elements
    - type: boolean
    - Check whether CSS pseudo-elements are used 
* no_js
    - type: boolean
    - Check whether no-js is used for older browsers
* html_errors
    - type: number
    - Number of HTML errors
* colors
    - type: number
    - Number of different colors used in CSS
* dominant_color
    - type: string
    - Dominant color used on a website

## Still not implemented attributes

* preprocessors
    - type: boolean
    - Detect whether website is using preprocessors (like Sass, Less etc.)
* frameworks
    - type: boolean
    - Detect whether website is using some kind of frontend frameworks (backbone.js, ember.js, angular js. etc.)
* cms_used
    - type: boolean
    - Detect whether website is using some kind of CMS
* sprite_images
    - type: boolean
    - Detect whether sprite images are used
* color_palette
    - type: string
    - Color palette used on website

## Requirements

### Set up phantomjs (developed with phantomjs 1.9.7)

http://phantomjs.org/download.html

### Python (developed with python 2.7.6)

```
pip install -r /path/to/requirements.txt
```

## Configuration

### Copy/Rename config file

```
cp config.sample.py config.py
```

### Adjust parameters

* PHANTOMJS_DIRECTORY
    - path to phantomjs directory
    - example: '/home/user/phantomjs-1.9.7-linux-x86_64/bin/'
* WPARSER_DIRECTORY
    - full path to wparser directory, which is actually current working directory 
    - example: /home/user/wparserjspath/dev/wparser'
* CSV_PATH
    - full path to CSS file
    - example: '/home/user/dev/wparser/input/test.csv'

## Run

```
python wparser.py
```

## Input

As an input to a parser, as an parameter you give CSV file, for which path is configured in config.py. You can find an example of file in [input/test.csv](input/test.csv). Be sure to keep the same structure.

## Output

Output is CSV file named output_final.csv, which you'll find in output' directory.

## TODO

* Parser still has problems with getting some CSS files (cross domain requests). I still didn't found any proper way to get CSS files. Maybe this can be handled with some external service written in python or something like that?
* Parser also has problems with some JS that it tries to compile from received urls - still don't know how to properly handle this
* use confess.js to get a list of requests etc - https://github.com/jamesgpearce/confess
* return error when site cannot be processed after some time