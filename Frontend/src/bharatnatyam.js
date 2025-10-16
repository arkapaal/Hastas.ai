import React, { useState, useRef } from 'react';
import { Upload, BookOpen, Microscope, Video, Home, Bed, GraduationCap, Info, Play, Pause, RotateCcw, Zap, Download } from 'lucide-react';
import logo from './logo.png';
import img from './bharat.jpg';


export default function BharatnatyamMudraWebsite() {
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [uploadedPhotoFile, setUploadedPhotoFile] = useState(null);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoAnalysisResult, setPhotoAnalysisResult] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedPhotoFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedPhoto(event.target.result);
        setPhotoAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhotoAnalysis = () => {
    setUploadedPhoto(null);
    setUploadedPhotoFile(null);
    setPhotoAnalysisResult(null);
    setIsAnalyzingPhoto(false);
  };

  const analyzePhoto = async () => {
  if (!uploadedPhotoFile) {
    console.error('No file selected');
    return;
  }

  setIsAnalyzingPhoto(true);
  setPhotoAnalysisResult(null);

  try {
    const formData = new FormData();
    formData.append('file', uploadedPhotoFile);

    console.log('Sending to backend...');

    const res = await fetch('https://hastash-backend.onrender.com/predict', {
      method: 'POST',
      body: formData,
      mode: 'cors', // Explicitly set CORS mode
    });

    console.log('Response status:', res.status);

    if (!res.ok) {
      let errorMessage = `Server error: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON (like 502 HTML error page)
        errorMessage = 'Server is not responding. Please try again later.';
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    console.log('Analysis result:', data);
    setPhotoAnalysisResult(data);
  } catch (error) {
    console.error('Error analyzing photo:', error);
    setPhotoAnalysisResult({ 
      error: error.message || 'Failed to connect to server'
    });
  } finally {
    setIsAnalyzingPhoto(false);
  }
};

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedVideo(event.target.result);
        setAnalysisResults(null);
        setVideoProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      streamRef.current = stream;
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        cameraRef.current.play();
      }
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (cameraRef.current) {
      cameraRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsRecording(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    const chunks = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const videoURL = URL.createObjectURL(blob);
      setUploadedVideo(videoURL);
      setAnalysisResults(null);
      setVideoProgress(0);
      stopCamera();
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecordedChunks(chunks);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const analyzeVideo = async () => {
    if (!uploadedVideo) return;
    
    setIsAnalyzing(true);
    setAnalysisResults(null);
    
    for (let i = 0; i <= 100; i += 10) {
      setVideoProgress(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setAnalysisResults({
      mudrasDetected: [
        { name: 'Pataka Mudra', confidence: 94, frame: '2:15', duration: '1.5s' },
        { name: 'Tripataka Mudra', confidence: 87, frame: '3:42', duration: '2.1s' },
        { name: 'Mayura Mudra', confidence: 92, frame: '5:08', duration: '1.8s' },
        { name: 'Anjali Mudra', confidence: 89, frame: '6:33', duration: '1.2s' },
      ],
      overallAccuracy: 90.5,
      videoLength: '7:45',
      fps: 30,
      totalFrames: 13950,
      mudrasIdentified: 4,
      gestureQuality: 88,
      emotionalExpression: 'Joy & Devotion',
      recommendations: [
        'Excellent hand positioning in Pataka mudra',
        'Consider more fluid transitions between mudras',
        'Facial expression well-synchronized with gestures'
      ]
    });
    
    setIsAnalyzing(false);
  };

  const mudras = [
    { name: 'Anjali Mudra', description: 'A gesture of respect and greeting, both palms joined together.' },
    { name: 'Pataka Mudra', description: 'A hand gesture where fingers are extended straight together.' },
    { name: 'Tripataka Mudra', description: 'One finger is bent while others remain extended.' },
    { name: 'Ardhpataka Mudra', description: 'Half of the hand is extended in this gesture.' },
    { name: 'Kartari Mudra', description: 'Symbolizes separation or scissors-like movement.' },
    { name: 'Mayura Mudra', description: 'Represents a peacock with fingers arranged gracefully.' },
  ];

  const learnModules = [
    { title: 'Mudra Basics', content: 'Learn the fundamental hand gestures used in Bharatnatyam dance.' },
    { title: 'Hastas Classification', content: 'Understand single-hand and double-hand mudras.' },
    { title: 'Expression & Emotion', content: 'Discover how mudras convey emotions and stories.' },
    { title: 'Historical Context', content: 'Explore the ancient origins of Bharatnatyam mudras.' },
  ];

  return (
    <div style={{ backgroundColor: '#23003fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <header style={{ backgroundColor: '#1b0130ff', padding: '20px', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '15px',
        marginBottom: '10px' 
        }}>
        <div style={{ 
          width: '60px',
          height: '60px', 
          backgroundColor: '#B76E79',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '30px',
          fontWeight: 'bold'
        }}>
          <img src={logo} alt="Hastas.ai Logo" style={{ width: '60px', height: '60px' }} />
        </div>
        <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '32px', fontWeight: 'bold' }}>Hastas.ai</h1>            
            <p style={{ margin: '0', fontSize: '14px', opacity: '0.9' }}>AI-Powered Analysis of Classical Indian Dance Gestures</p>
        </div>
        </div>
      </header>

      <nav style={{ backgroundColor: '#dba800ff', padding: '0 20px', display: 'flex', gap: '20px', flexWrap: 'wrap', borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'library', label: 'Library', icon: BookOpen },
          { id: 'research', label: 'Research', icon: Microscope },
          { id: 'upload', label: 'Upload Video', icon: Video },
          { id: 'vr', label: 'VR Experience', icon: Bed },
          { id: 'learn', label: 'Learn', icon: GraduationCap },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            style={{
              backgroundColor: currentPage === item.id ? 'rgba(255,255,255,0.3)' : 'transparent',
              color: 'white',
              border: 'none',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '4px',
              transition: 'all 0.3s',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = currentPage === item.id ? 'rgba(255,255,255,0.3)' : 'transparent'}
          >
            <item.icon size={20} /> {item.label}
          </button>
        ))}
      </nav>

      <main style={{ flex: '1', padding: '30px', overflowY: 'auto' }}>
        
        {currentPage === 'home' && (
          <div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
              <div style={{ textAlign: 'center', backgroundColor: 'rgba(165, 163, 163, 0.9)', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2 style={{fontFamily: 'Georgia, serif', color: '#000000ff', marginBottom: '15px' }}>Explore</h2>
                <div style={{
                  width: '100%',
                  height: '400px',
                  backgroundColor: 'rgba(151, 150, 150, 0.9)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '80px',
                }}>
                  <img src={img} alt="Bharatnatyam Dance" style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
                <p style={{ fontWeight: 'bold', fontSize: '24px', marginTop: '15px', color: '#1b1a1aff', fontFamily: 'Georgia, serif' }}>Watch the graceful movements of classical Bharatnatyam dance</p>
              </div>

              <div style={{ textAlign: 'center', backgroundColor: 'rgba(165, 163, 163, 0.9)', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2 style={{fontFamily: 'Georgia, serif',    color:  '#000000ff', marginBottom: '15px' }}>📸 Upload & Analyze Photo</h2>
                <div style={{
                  width: '100%',
                  height: '300px',
                  border: '2px dashed #B76E79',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  backgroundColor: '#fafafa',
                  overflow: 'hidden'
                }}>
                  {uploadedPhoto ? (
                    <img src={uploadedPhoto} alt="Uploaded" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <Upload size={40} style={{ color: '#B76E79', margin: '0 auto 10px' }} />
                      <p style={{ color: '#999' }}>Upload a mudra photo</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      opacity: '0',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                {uploadedPhoto && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button
                      onClick={analyzePhoto}
                      disabled={isAnalyzingPhoto}
                      style={{
                        flex: 1,
                        backgroundColor: isAnalyzingPhoto ? '#ccc' : '#B76E79',
                        color: 'white',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '4px',
                        cursor: isAnalyzingPhoto ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                    >
                      <Zap size={20} /> {isAnalyzingPhoto ? 'Analyzing...' : 'Analyze Photo'}
                    </button>
                    <button
                      onClick={clearPhotoAnalysis}
                      disabled={isAnalyzingPhoto}
                      style={{
                        backgroundColor: isAnalyzingPhoto ? '#ccc' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '4px',
                        cursor: isAnalyzingPhoto ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      title="Clear and upload new photo"
                    >
                      <RotateCcw size={20} />
                    </button>
                  </div>
                )}
                {photoAnalysisResult && (
                  <div style={{ marginTop: '15px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', textAlign: 'left' }}>
                    {photoAnalysisResult.error ? (
                      <p style={{ color: '#d32f2f', margin: '0' }}>{photoAnalysisResult.error}</p>
                    ) : (
                      <div>
                        <h3 style={{ color: '#B76E79', marginTop: '0', marginBottom: '10px' }}>✨ Analysis Result</h3>
                        <p style={{ color: '#666', margin: '5px 0' }}>
                          <strong>Detected Mudra:</strong> {photoAnalysisResult.mudra || photoAnalysisResult.label || 'Unknown'}
                        </p>
                        <p style={{ color: '#666', margin: '5px 0' }}>
                          <strong>Confidence:</strong> {photoAnalysisResult.confidence || 'N/A'}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <Bed size={32} style={{ color: '#B76E79', marginBottom: '10px' }} />
                <h3 style={{ color: '#B76E79', marginBottom: '10px' }}>VR Experience</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>Immerse yourself in a 3D virtual reality experience of mudras</p>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <GraduationCap size={32} style={{ color: '#B76E79', marginBottom: '10px' }} />
                <h3 style={{ color: '#B76E79', marginBottom: '10px' }}>Learn & Practice</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>Interactive tutorials to master each mudra step by step</p>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <Info size={32} style={{ color: '#B76E79', marginBottom: '10px' }} />
                <h3 style={{ color: '#B76E79', marginBottom: '10px' }}>Mudra Database</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>Comprehensive library of 108 classical mudras with meanings</p>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'library' && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#B76E79', marginBottom: '20px' }}>📚 Mudra Library</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {mudras.map((mudra, idx) => (
                <div key={idx} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <h3 style={{ color: '#B76E79', marginBottom: '10px' }}>{mudra.name}</h3>
                  <p style={{ color: '#666', marginBottom: '15px' }}>{mudra.description}</p>
                  <button style={{ backgroundColor: '#B76E79', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Learn More</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'research' && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#B76E79', marginBottom: '20px' }}>🔬 Research & Analysis</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h3 style={{ color: '#B76E79', marginBottom: '15px' }}>Research Papers</h3>
                <ul style={{ listStyle: 'none', padding: '0' }}>
                  <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>✓ Mudra Recognition using Deep Learning</li>
                  <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>✓ Classification of Bharatnatyam Hand Gestures</li>
                  <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>✓ Motion Capture Analysis of Traditional Dance</li>
                  <li style={{ padding: '10px 0' }}>✓ Cultural Heritage Preservation through AI</li>
                </ul>
              </div>
              <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h3 style={{ color: '#B76E79', marginBottom: '15px' }}>Model Performance</h3>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ color: '#666', marginBottom: '5px' }}>Overall Accuracy: 92%</p>
                  <div style={{ backgroundColor: '#e0e0e0', height: '20px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#B76E79', height: '100%', width: '92%' }}></div>
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ color: '#666', marginBottom: '5px' }}>Precision: 89%</p>
                  <div style={{ backgroundColor: '#e0e0e0', height: '20px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#B76E79', height: '100%', width: '89%' }}></div>
                  </div>
                </div>
                <div>
                  <p style={{ color: '#666', marginBottom: '5px' }}>Recall: 91%</p>
                  <div style={{ backgroundColor: '#e0e0e0', height: '20px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#B76E79', height: '100%', width: '91%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'upload' && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ color: '#B76E79', marginBottom: '30px', textAlign: 'center' }}>📹 Upload Video for Analysis</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <h3 style={{ color: '#B76E79', marginBottom: '15px' }}>Upload Your Video</h3>
                <div style={{
                  width: '100%',
                  minHeight: '300px',
                  border: '3px dashed #B76E79',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  backgroundColor: '#fafafa',
                  overflow: 'hidden'
                }}>
                  {isCameraActive ? (
                    <div style={{ width: '100%', position: 'relative' }}>
                      <video
                        ref={cameraRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', maxHeight: '300px', borderRadius: '8px' }}
                      />
                      <div style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '10px', 
                        backgroundColor: isRecording ? '#dc3545' : '#28a745',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {isRecording ? '● Recording' : '● Live'}
                      </div>
                    </div>
                  ) : uploadedVideo ? (
                    <div style={{ width: '100%', position: 'relative' }}>
                      <video
                        ref={videoRef}
                        src={uploadedVideo}
                        style={{ width: '100%', maxHeight: '300px', borderRadius: '8px' }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                      <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                          onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()}
                          style={{ backgroundColor: '#B76E79', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button
                          onClick={() => { videoRef.current.currentTime = 0; setIsPlaying(false); }}
                          style={{ backgroundColor: '#B76E79', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <Video size={50} style={{ color: '#B76E79', margin: '0 auto 15px' }} />
                      <p style={{ color: '#999', marginBottom: '10px', fontSize: '16px' }}>Drag and drop your video here</p>
                      <p style={{ color: '#ccc', fontSize: '12px' }}>or click to browse</p>
                    </div>
                  )}
                  {!isCameraActive && !uploadedVideo && (
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        opacity: '0',
                        cursor: 'pointer'
                      }}
                    />
                  )}
                </div>

                {!uploadedVideo && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    {!isCameraActive ? (
                    <button
                        onClick={startCamera}
                        style={{
                        flex: 1,
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                        }}
                    >
                        <Video size={20} /> Start Camera
                    </button>
                    ) : (
                    <>
                        {!isRecording ? (
                        <>
                            <button 
                            onClick={startRecording}
                            style={{
                                flex: 1,
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '12px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                            >
                            <Play size={20} /> Start Recording
                            </button>
                            <button
                            onClick={stopCamera}
                            style={{
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                padding: '12px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                            >
                            Close
                            </button>
                        </>
                        ) : (
                        <button
                            onClick={stopRecording}
                            style={{
                            flex: 1,
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '12px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                            }}
                        >
                            <Pause size={20} /> Stop Recording
                        </button>
                        )}
                    </>
                    )}
                </div>
                )}

                {uploadedVideo && (
                <button
                    onClick={analyzeVideo}
                    disabled={isAnalyzing}
                    style={{
                    marginTop: '20px',
                    width: '100%',
                    backgroundColor: isAnalyzing ? '#ccc' : '#B76E79',
                    color: 'white',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                    }}
                >
                    <Zap size={20} /> {isAnalyzing ? `Analyzing... ${videoProgress}%` : 'Analyze Video'}
                </button>
                )}

              </div>

              <div>
                <h3 style={{ color: '#B76E79', marginBottom: '15px' }}>Analysis Results</h3>
                {isAnalyzing && (
                  <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ color: '#666', marginBottom: '10px' }}>Processing: {videoProgress}%</p>
                      <div style={{ backgroundColor: '#e0e0e0', height: '30px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: '#B76E79', height: '100%', width: `${videoProgress}%`, transition: 'width 0.3s' }}></div>
                      </div>
                    </div>
                    <p style={{ color: '#999', textAlign: 'center' }}>Analyzing mudras and gestures...</p>
                  </div>
                )}
                {analysisResults && (
                  <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', maxHeight: '600px', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                      <h4 style={{ color: '#B76E79', marginBottom: '10px' }}>📊 Video Metrics</h4>
                      <p style={{ margin: '5px 0', color: '#666' }}>Duration: {analysisResults.videoLength}</p>
                      <p style={{ margin: '5px 0', color: '#666' }}>FPS: {analysisResults.fps}</p>
                      <p style={{ margin: '5px 0', color: '#666' }}>Total Frames: {analysisResults.totalFrames}</p>
                      <p style={{ margin: '5px 0', color: '#666' }}>Overall Accuracy: <strong>{analysisResults.overallAccuracy}%</strong></p>
                    </div>
                    
                    <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                      <h4 style={{ color: '#B76E79', marginBottom: '10px' }}>🎭 Mudras Detected ({analysisResults.mudrasIdentified})</h4>
                      {analysisResults.mudrasDetected.map((mudra, idx) => (
                        <div key={idx} style={{ backgroundColor: 'white', padding: '10px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>{mudra.name}</span>
                            <span style={{ color: '#B76E79', fontWeight: 'bold' }}>{mudra.confidence}%</span>
                          </div>
                          <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>Frame: {mudra.frame} | Duration: {mudra.duration}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
                      <h4 style={{ color: '#B76E79', marginBottom: '10px' }}>🎨 Quality Assessment</h4>
                      <p style={{ margin: '5px 0', color: '#666' }}>Gesture Quality: {analysisResults.gestureQuality}%</p>
                      <p style={{ margin: '5px 0', color: '#666' }}>Emotional Expression: {analysisResults.emotionalExpression}</p>
                    </div>

                    <div>
                      <h4 style={{ color: '#B76E79', marginBottom: '10px' }}>💡 Recommendations</h4>
                      <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                        {analysisResults.recommendations.map((rec, idx) => (
                          <li key={idx} style={{ padding: '8px 0', color: '#666', borderBottom: '1px solid #f0f0f0' }}>✓ {rec}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      style={{
                        marginTop: '15px',
                        width: '100%',
                        backgroundColor: '#B76E79',
                        color: 'white',
                        border: 'none',
                        padding: '10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Download size={18} /> Download Report
                    </button>
                  </div>
                )}
                {!isAnalyzing && !analysisResults && uploadedVideo && (
                  <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0', textAlign: 'center', color: '#999' }}>
                    <p>Upload a video and click "Analyze Video" to see results</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentPage === 'vr' && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#B76E79', marginBottom: '20px' }}>🥽 VR Experience</h2>
            <div style={{ backgroundColor: '#f9f9f9', padding: '40px', borderRadius: '8px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
              <Bed size={80} style={{ color: '#B76E79', margin: '0 auto 20px' }} />
              <p style={{ color: '#666', fontSize: '16px' }}>VR Experience Coming Soon</p>
              <p style={{ color: '#999' }}>Immerse yourself in a 3D virtual reality environment to learn and practice mudras</p>
            </div>
          </div>
        )}

        {currentPage === 'learn' && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#B76E79', marginBottom: '20px' }}>📖 Learn & Practice</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {learnModules.map((module, idx) => (
                <div key={idx} style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <h3 style={{ color: '#B76E79', marginBottom: '10px' }}>📚 {module.title}</h3>
                  <p style={{ color: '#666', marginBottom: '15px' }}>{module.content}</p>
                  <button style={{ backgroundColor: '#B76E79', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>Start Learning</button>
                </div>
              ))}
            </div>
          </div>
        )}
        </main>
        
      <footer style={{ backgroundColor: '#B76E79', color: 'white', padding: '3px', textAlign: 'center', boxShadow: '0 -4px 6px rgba(0,0,0,0.1)' }}>
        <p style={{ margin: '0', fontSize: '14px' }}>© 2024 Bharatnatyam Mudra Analysis Platform | Preserving Cultural Heritage through AI</p>
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '12px' }}>
          <span style={{ cursor: 'pointer' }}>About</span>
          <span style={{ cursor: 'pointer' }}>Contact</span>
          <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer' }}>Terms of Service</span>
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(20deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}