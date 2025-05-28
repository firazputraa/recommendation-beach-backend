// ----Kolom deklarasi variabel-----
let input = document.querySelector('input');
let button = document.querySelector('button');
button.addEventListener('click', onClick);

let isModelLoaded = false;
let model;
let word2index;

// Parameter data preprocessing
// Mengubah maxlen dari 100 menjadi 20 agar sesuai dengan shape input model
const maxlen = 20; // <-- PERUBAHAN DI SINI
const vocab_size = 2000;
const padding = 'post';
const truncating = 'post';

var myVar;
// -----------------------------------

function myFunction() {
    myVar = setTimeout(showPage, 3000);
}

function showPage() {
    document.getElementById("loaderlabel").style.display = "none";
    document.getElementById("loader").style.display = "none";
    document.getElementById("mainAPP").style.display = "block";
}

function detectWebGLContext () {
    // Create canvas element. The canvas is not added to the
    // document itself, so it is never displayed in the
    // browser window.
    var canvas = document.createElement("canvas");
    // Get WebGLRenderingContext from canvas element.
    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    // Report the result.
    if (gl && gl instanceof WebGLRenderingContext) {
        console.log("Congratulations! Your browser supports WebGL.");
        init();
    } else {
        // Mengganti alert() dengan pesan di konsol atau UI kustom
        console.error("Failed to get WebGL context. Your browser or device may not support WebGL.");
        // Anda bisa menambahkan elemen UI untuk menampilkan pesan ini kepada pengguna
        displayMessage("Failed to get WebGL context. Your browser or device may not support WebGL.", "error");
    }
}

detectWebGLContext();

// Fungsi untuk menampilkan pesan kepada pengguna (pengganti alert)
function displayMessage(message, type = "info") {
    const messageContainer = document.getElementById('messageContainer'); // Pastikan ada elemen ini di HTML Anda
    if (messageContainer) {
        messageContainer.innerHTML = `<div class="p-4 rounded-lg ${type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">${message}</div>`;
        // Opsional: sembunyikan pesan setelah beberapa detik
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    } else {
        console.log(`Message (${type}): ${message}`);
    }
}


// ----Kolom fungsi `getInput()`-----
// Fungsi untuk mengambil input review
function getInput(){
    const reviewText = document.getElementById('input')
    return reviewText.value;
}
// -----------------------------------

// ----Kolom fungsi `padSequence()`-----
// Fungsi untuk melakukan padding
function padSequence(sequences, maxLen, padding='post', truncating = "post", pad_value = 0){
    return sequences.map(seq => {
        if (seq.length > maxLen) { //truncat
            if (truncating === 'pre'){
                seq.splice(0, seq.length - maxLen);
            } else {
                seq.splice(maxLen, seq.length - maxLen);
            }
        }

        if (seq.length < maxLen) {
            const pad = [];
            for (let i = 0; i < maxLen - seq.length; i++){
                pad.push(pad_value);
            }
            if (padding === 'pre') {
                seq = pad.concat(seq);
            } else {
                seq = seq.concat(pad);
            }
        }
        return seq;
    });
}
// -----------------------------------


// ----Kolom fungsi `predict()`-----
// Fungsi untuk melakukan prediksi
function predict(inputText){

    // Mengubah input review ke dalam bentuk token
    const sequence = inputText.map(word => {
        let indexed = word2index[word];

        if (indexed === undefined){
            return 1; //change to oov value
        }
        return indexed;
    });

    // Melakukan padding
    // paddedSequence akan menjadi array of arrays, e.g., [[val1, val2, ..., val20]]
    const paddedSequence = padSequence([sequence], maxlen);

    const score = tf.tidy(() => {
        // Mengakses elemen pertama dari paddedSequence untuk mendapatkan array 1D dari angka
        // Menggunakan konstanta maxlen untuk shape
        const input = tf.tensor2d(paddedSequence[0], [1, maxlen]); // [batch_size, input_length]

        const result = model.predict(input);
        return result.dataSync()[0];
    });

    return score;

}
// -----------------------------------


// ----Kolom fungsi `onClick()`-----
// Fungsi yang dijalankan ketika tombol "Post Review" diclick
function onClick(){

    if(!isModelLoaded) {
        // Mengganti alert()
        displayMessage('Model not loaded yet. Please wait.', 'info');
        return;
    }

    if (getInput() === '') {
        // Mengganti alert()
        displayMessage("Review Can't be Null. Please enter some text.", 'error');
        document.getElementById('input').focus();
        return;
    }

    //
    const inputText = getInput().trim().toLowerCase().split(" ");

    // Score prediksi dengan nilai 0 s/d 1
    let score = predict(inputText);

    // Kondisi penentuan hasil prediksi berdasarkan nilai score
    if (score > 0.5) {
        // Mengganti alert()
        displayMessage(`Positive Review\nScore: ${score.toFixed(4)}`, 'success');
    } else {
        // Mengganti alert()
        displayMessage(`Negative Review\nScore: ${score.toFixed(4)}`, 'info');
    }
}
// -----------------------------------


// ----Kolom fungsi `init()`-----
async function init(){

    // Memanggil model tfjs
    // model = await tf.loadLayersModel('http://127.0.0.1:5500/tfjs_model/model.json'); // Untuk VS Code Live Server
    try {
        model = await tf.loadLayersModel('http://localhost:8000/tfjs_model/model.json');
        console.log('Model loaded successfully:', model);
        console.log(model.summary());
        isModelLoaded = true;
    } catch (error) {
        console.error('Error loading model:', error);
        displayMessage('Failed to load the model. Please check the server and model path.', 'error');
    }

    //Memanggil word_index
    // const word_indexjson = await fetch('http://127.0.0.1:5500/word_index.json'); // Untuk VS Code Live Server
    try {
        const word_indexjson = await fetch('http://localhost:8000/word_index.json');
        word2index = await word_indexjson.json();
        console.log('Model & Metadata Loaded Succesfully');
        displayMessage('Model and metadata loaded successfully!', 'success');
    } catch (error) {
        console.error('Error loading word_index.json:', error);
        displayMessage('Failed to load word index. Check the server and file path.', 'error');
    }
}
// -----------------------------------
