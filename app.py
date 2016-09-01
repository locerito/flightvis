#!flask/bin/python
from flask import Flask, jsonify, render_template
from datetime import datetime
from werkzeug.contrib.cache import SimpleCache

import pandas as pd

app = Flask(__name__)

cache = SimpleCache()

@app.route('/api/flight/<date>/<time>', methods=['GET'])
def get_flights(date, time):
    dt = datetime.strptime(date+time, '%Y%m%d%H%M%S')
    df = cache.get('cache-flights')
    if df is None:
        df = pd.read_csv('data/data200801_complete.csv', sep=',')
        cache.set('cache-flights', df, timeout=5 * 60)
    out = df.loc[df.Ts == dt.strftime('%Y-%m-%d %H:%M:%S'),
        ['Ts', 'FlightNum', 'AirTime', 'Origin', 'Dest',
         'Distance', 'coord_ori', 'coord_dest']]
    return out.to_json(orient='records')

@app.route('/api/airport/', methods=['GET'])
def get_airports():
    df = cache.get('cache-airports')
    if df is None:
        df = pd.read_csv('data/airports.csv', sep=',')
        cache.set('cache-airports', df, timeout=5 * 60)
    return df.to_json(orient='records')

@app.route('/', methods=['GET'])
def index():
    user = {'nickname': 'Manuel'}
    return render_template('index.html',
                           title='Home',
                           user=user)

if __name__ == '__main__':
    app.run(debug=True)