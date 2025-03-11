from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import os
import uuid
import trimesh
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB

current_model_path = None

@app.route('/api/upload', methods=['POST'])
def upload_file():
    global current_model_path
    
    print("Upload endpoint called")
    
    if 'file' not in request.files:
        return jsonify({'message': 'No file part in the request'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
        
    if file:
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        file.save(file_path)
        print(f"File saved at: {file_path}")
        
        current_model_path = file_path
        
        absolute_url = f"http://127.0.0.1:5000/api/models/{unique_filename}"
        
        return jsonify({
            'url': absolute_url,
            'filename': unique_filename,
            'message': 'File uploaded successfully'
        }), 200

@app.route('/api/models/<filename>', methods=['GET'])
def get_model(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    print(f"Attempting to serve file: {file_path}")
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return jsonify({'message': f'File not found: {filename}'}), 404
    
    try:
        content_type = None
        if filename.lower().endswith('.obj'):
            content_type = 'model/obj'
        elif filename.lower().endswith('.stl'):
            content_type = 'model/stl'
        else:
            content_type = 'application/octet-stream'
        
        file_size = os.path.getsize(file_path)
        print(f"Serving file: {file_path}, size: {file_size}, type: {content_type}")
        
        return send_file(
            file_path,
            mimetype=content_type,
            as_attachment=False,
            etag=False,
            max_age=0,
            conditional=False,
            download_name=filename,
            last_modified=None
        )
        
    except Exception as e:
        print(f"Error serving file: {str(e)}")
        return jsonify({'message': f'Error serving file: {str(e)}'}), 500

@app.route('/api/export', methods=['GET'])
def export_model():
    global current_model_path
    
    if not current_model_path:
        return jsonify({'message': 'No model available to export'}), 400
        
    export_format = request.args.get('format', '').lower()
    
    if export_format not in ['stl', 'obj']:
        return jsonify({'message': 'Unsupported export format'}), 400
    
    try:
        mesh = trimesh.load(current_model_path)
        
        export_path = os.path.join(
            app.config['UPLOAD_FOLDER'], 
            f"exported_{uuid.uuid4()}.{export_format}"
        )
        
        if export_format == 'stl':
            mesh.export(export_path, file_type='stl')
        elif export_format == 'obj':
            mesh.export(export_path, file_type='obj')
        
        return send_file(
            export_path, 
            as_attachment=True, 
            download_name=f"model.{export_format}",
            mimetype=f'model/{export_format}'
        )
    
    except Exception as e:
        print(f"Export error: {str(e)}")
        return jsonify({'message': f'Error exporting model: {str(e)}'}), 500

if __name__ == '__main__':
    print(f"Flask server starting. Upload folder: {UPLOAD_FOLDER}")
    app.run(debug=True)