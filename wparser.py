from config import *
from w3cvalidator import *
from py_w3c.validators.html.validator import HTMLValidator
import subprocess
import csv
import os
import colorific
import re
import webcolors

all = []
 
def wparser():
    command = [PHANTOMJS_DIRECTORY + 'phantomjs', 'wparser.js', CSV_PATH]
    p = subprocess.Popen(command, cwd=WPARSER_DIRECTORY, shell=False)
    p.communicate()
    return p.returncode

# source: http://stackoverflow.com/questions/9694165/convert-rgb-color-to-english-color-name-like-green
def closest_colour(requested_colour):
    min_colours = {}
    for key, name in webcolors.css3_hex_to_names.items():
        r_c, g_c, b_c = webcolors.hex_to_rgb(key)
        rd = (r_c - requested_colour[0]) ** 2
        gd = (g_c - requested_colour[1]) ** 2
        bd = (b_c - requested_colour[2]) ** 2
        min_colours[(rd + gd + bd)] = name
    return min_colours[min(min_colours.keys())]

# source: http://stackoverflow.com/questions/9694165/convert-rgb-color-to-english-color-name-like-green
def get_colour_name(requested_colour):
    try:
        closest_name = actual_name = webcolors.rgb_to_name(requested_colour)
    except ValueError:
        closest_name = closest_colour(requested_colour)
        actual_name = None
    return actual_name, closest_name

def colors(reader_list):
    for idx, row in enumerate(reader_list):
        if idx == 0:
            row.append('colors')
            row.append('color_palette')
            row.append('dominant_color')
            continue
        url = row[0]
        screenshot_path = 'screenshots/' + re.sub('[^A-Za-z0-9]+', '', url) + '.png'
        palette = colorific.extract_colors(screenshot_path, min_prominence=0.1, max_colors=50)
        colors = []
        dominant_color = ''
        index = 0
        for color in palette.colors:
            actual_name, closest_name = get_colour_name(color.value)
            current_color = closest_name
            if actual_name:
                current_color = actual_name

            if index == 0:
                dominant_color = current_color

            colors.append(current_color)
            index += 1

        row.append(len(colors))
        row.append(",".join(colors))
        row.append(dominant_color)

def htmlerrors(reader_list):
    for idx, row in enumerate(reader_list):
        if idx == 0:
            row.append('html_errors')
            continue
        url = row[0]
        result = validate(url)
        errors = 0
        for message in result['messages']:
            if message['type'] == 'error':
                errors += 1
        row.append(errors)

wparsercode = wparser()

# continue with parsing and writing data
if wparsercode == 1:
    output_csv = 'output/output.csv'
    output_final_csv = 'output/output_final.csv'

    with open(output_csv,'r') as csvinput:
        with open(output_final_csv, 'w') as csvoutput:
            reader = csv.reader(csvinput)
            reader_list = list(reader)
            writer = csv.writer(csvoutput, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL, lineterminator='\n')

            htmlerrors(reader_list)
            colors(reader_list,)

            writer.writerows(reader_list)

    os.remove(output_csv)