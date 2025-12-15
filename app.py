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
    stations = [dict(row) for row in rows]


    curs.execute("SELECT value FROM timestamp WHERE key = 'last_update'")
    row = curs.fetchone()
    last_update = row["value"] if row else "Unknown"

    db.close()


    return render_template("index.html", stations=stations, last_update=last_update)
