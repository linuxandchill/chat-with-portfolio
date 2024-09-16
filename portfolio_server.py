import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import robin_stocks.robinhood as r
from pprint import pprint

load_dotenv()
RH_EMAIL = os.getenv("RH_EMAIL")
RH_PW = os.getenv("RH_PW")

login = r.login(RH_EMAIL, RH_PW)
app = Flask(__name__)

@app.route('/holdings', methods=['GET'])
def get_message():
    my_holdings = r.build_holdings()
    pprint(my_holdings)
    return jsonify({"holdings": my_holdings})

if __name__ == '__main__':
    app.run(port=5001, debug=True)
