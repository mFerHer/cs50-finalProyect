from flask import Flask, render_template
import sqlite3


app = Flask(__name__)

@app.route("/")

def index():
    db = sqlite3.connect("data.db")
    db.row_factory = sqlite3.Row
    curs = db.cursor()
    curs.execute("SELECT * FROM info JOIN prices ON info.id = prices.id")
    rows = curs.fetchall()
    db.close()

    # Convert sqlite Row objects to dicts so Jinja |tojson works
    stations = [dict(row) for row in rows]

    return render_template("index.html", stations=stations)
