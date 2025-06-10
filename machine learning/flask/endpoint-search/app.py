from flask import Flask, request, jsonify
import os
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import pandas as pd


app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'sentiment', 'sentiment_model_lstm.h5')
TOKENIZER_PATH = os.path.join(os.path.dirname(__file__), 'models', 'sentiment', 'tokenizer.pkl')
WORD_INDEX_PATH = os.path.join(os.path.dirname(__file__), 'models', 'sentiment', 'word_index.json')
LEXICON_POSITIVE_PATH = os.path.join(os.path.dirname(__file__), 'models', 'sentiment', 'lexicon_positive.json')
LEXICON_NEGATIVE_PATH = os.path.join(os.path.dirname(__file__), 'models', 'sentiment', 'lexicon_negative.json')
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), 'models', 'search', 'tfidf_vectorizer.pkl')
MATRIX_PATH = os.path.join(os.path.dirname(__file__), 'models', 'search', 'tfidf_matrix.pkl')
DATA_PATH = os.path.join(os.path.dirname(__file__), 'models', 'search', 'cbr_cleaned.csv')

# --- Global Variables for ML Assets ---
sentiment_model = None
tokenizer = None
lexicon_positive = {}
lexicon_negative = {}
stemmer = None # Sastrawi stemmer
# --- Load Vectorizer for Search ---
tfidf_vectorizer = None
tfidf_matrix = None
data = None
stopword_remover = StopWordRemoverFactory().create_stop_word_remover()

# ======= Load dan Siapkan Data Sekali di Awal =======
df = pd.read_csv(DATA_PATH)  # File CSV harus punya kolom 'description'
texts = df["combined_text"].fillna("").tolist()

# Fit TF-IDF di startup
tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = tfidf_vectorizer.fit_transform(texts)

# Konversi ke list of dict agar bisa jsonify
data = df.to_dict(orient="records")



# ======= Endpoint Rekomendasi =======
@app.route('/api/search-point', methods=['POST'])
def search_point():
    req_data = request.get_json()
    query = req_data.get("query")

    if not query or not isinstance(query, str):
        return jsonify({"error": "Query kosong atau tidak valid"}), 400

    try:
        query_vector = tfidf_vectorizer.transform([query])
        cosine_sim = cosine_similarity(query_vector, tfidf_matrix).flatten()
        top_indices = cosine_sim.argsort()[-10:][::-1]

        recommendations = []
        for i in top_indices:
            beach_info = data[i]
            beach_info['similarity_score'] = float(cosine_sim[i])
            recommendations.append(beach_info)

        return jsonify({"recommendations": recommendations})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Terjadi kesalahan saat memproses"}), 500


if __name__ == "__main__":
    app.run(debug=True)
