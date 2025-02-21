from flask import Flask, request, redirect, render_template, jsonify, make_response
from flask_pymongo import PyMongo
from datetime import datetime
import random
import string
import os
from dotenv import load_dotenv
import json
from urllib.parse import quote_plus, urlparse

load_dotenv()

app = Flask(__name__, template_folder='template', static_folder='static', static_url_path='/static')
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
mongo = PyMongo(app)

def generate_short_id():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=8))

def get_client_info():
    user_agent = request.user_agent
    return {
        'ip': request.remote_addr or 'Unknown',
        'user_agent': user_agent.string,
        'platform': request.headers.get('sec-ch-ua-platform', user_agent.platform or 'Unknown'),
        'browser': user_agent.browser or 'Unknown',
        'version': user_agent.version or '',
        'language': request.accept_languages.best or 'Unknown',
        'referrer': request.referrer or 'Direct',
        'timestamp': datetime.now(),
        'remote_port': request.environ.get('REMOTE_PORT', 'Unknown'),
        'accept': request.headers.get('Accept', 'Unknown'),
        'accept_language': request.headers.get('Accept-Language', 'Unknown'),
        'accept_encoding': request.headers.get('Accept-Encoding', 'Unknown'),
        'screen_size': request.headers.get('Sec-CH-UA-Platform-Screen', 'Unknown'),
        'window_size': request.headers.get('Viewport-Width', 'Unknown'),
        'country': request.headers.get('CF-IPCountry', 'Unknown'),  # If using Cloudflare
        'isp': request.headers.get('X-ISP', 'Unknown'),  # Requires additional middleware
        'ip_version': 'IPv6' if ':' in request.remote_addr else 'IPv4'
    }

def is_valid_url(url):
    if not url or url.isspace():
        return False
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

@app.route('/')
def home():
    account_id = request.cookies.get('account_id')
    
    stats = {
        'total_links': mongo.db.links.count_documents({}),
        'total_clicks': mongo.db.analytics.count_documents({}),
        'chart_data': {
            'ip_versions': list(mongo.db.analytics.aggregate([
                {"$group": {"_id": "$ip_version", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ])),
            'os_stats': list(mongo.db.analytics.aggregate([
                {"$group": {"_id": "$platform", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ])),
            'country_stats': list(mongo.db.analytics.aggregate([
                {"$group": {"_id": "$country", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ])),
            'isp_stats': list(mongo.db.analytics.aggregate([
                {"$group": {"_id": "$isp", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]))
        },
        'logged_in': bool(account_id)
    }
    return render_template('index.html', stats=stats)

@app.route('/register', methods=['POST'])
def register():
    account_id = ''.join(random.choices(string.digits, k=8))
    while mongo.db.users.find_one({'account_id': account_id}):
        account_id = ''.join(random.choices(string.digits, k=8))
    
    mongo.db.users.insert_one({'account_id': account_id})
    return jsonify({'account_id': account_id})

@app.route('/login', methods=['POST'])
def login():
    account_id = request.json.get('account_id')
    user = mongo.db.users.find_one({'account_id': account_id})
    if user:
        response = make_response(jsonify({'success': True}))
        response.set_cookie('account_id', account_id, max_age=31536000)
        return response
    return jsonify({'success': False}), 401

@app.route('/logout', methods=['POST'])
def logout():
    response = make_response(jsonify({'success': True}))
    response.delete_cookie('account_id')
    return response

@app.route('/create', methods=['POST'])
def create_link():
    account_id = request.json.get('account_id')
    target_url = request.json.get('url')
    
    if not mongo.db.users.find_one({'account_id': account_id}):
        return jsonify({'error': 'Invalid account'}), 401

    if not is_valid_url(target_url):
        return jsonify({'error': 'Invalid URL. Please provide a valid URL with scheme (e.g., http:// or https://)'}), 400

    short_id = generate_short_id()
    mongo.db.links.insert_one({
        'short_id': short_id,
        'target_url': target_url,
        'account_id': account_id,
        'created_at': datetime.now()
    })
    
    return jsonify({'short_url': f'/l/{short_id}'})

@app.route('/l/<short_id>')
def redirect_link(short_id):
    link = mongo.db.links.find_one({'short_id': short_id})
    if not link:
        return 'Link not found', 404

    client_info = get_client_info()
    mongo.db.analytics.insert_one({
        'link_id': short_id,
        'account_id': link['account_id'],
        **client_info
    })
    
    return redirect(link['target_url'])

@app.route('/analytics/<account_id>')
def get_analytics(account_id):
    if not mongo.db.users.find_one({'account_id': account_id}):
        return jsonify({'error': 'Invalid account'}), 401

    links = list(mongo.db.links.find({'account_id': account_id}, {'_id': 0}))
    analytics = list(mongo.db.analytics.find({'account_id': account_id}, {'_id': 0}))
    
    return jsonify({
        'links': links,
        'analytics': analytics
    })

@app.route('/delete/<short_id>', methods=['DELETE'])
def delete_link(short_id):
    account_id = request.cookies.get('account_id')
    if not account_id:
        return jsonify({'error': 'Not logged in'}), 401

    link = mongo.db.links.find_one({'short_id': short_id, 'account_id': account_id})
    if not link:
        return jsonify({'error': 'Link not found or unauthorized'}), 404

    # Delete the link and its analytics
    mongo.db.links.delete_one({'short_id': short_id})
    mongo.db.analytics.delete_many({'link_id': short_id})
    
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
