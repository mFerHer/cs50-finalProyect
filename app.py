from flask import Flask, render_template
import sqlite3
import os


app = Flask(__name__)

@app.route("/")
def index():
    
    db = sqlite3.connect("data.db")
    db.row_factory = sqlite3.Row
    curs = db.cursor()

    curs.execute("""SELECT * FROM info
                    JOIN prices ON info.id = prices.id""")

    stations = curs.fetchall()
    db.close()

    return render_template("index.html", stations=stations)
