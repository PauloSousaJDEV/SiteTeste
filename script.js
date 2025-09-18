// Seleciona os elementos do carrossel
const slides = document.querySelectorAll('.slide');
const indicators = document.querySelectorAll('.indicator');
const audioPlayer = new Audio();
let currentSlideIndex = 0;

// Função para tocar música
function playMusic(src) {
    if (audioPlayer.src !== src) {
        audioPlayer.src = src;
        audioPlayer.play();
    }
}

// Função para mudar slide
function changeSlide(newIndex) {
    if (newIndex === currentSlideIndex) return;

    const currentSlide = slides[currentSlideIndex];
    const nextSlide = slides[newIndex];

    // Verifica se a música do próximo slide é diferente
    const currentMusic = currentSlide.dataset.music;
    const nextMusic = nextSlide.dataset.music;

    if (currentMusic !== nextMusic) {
        playMusic(nextMusic);
    }

    // Atualiza os slides ativos
    currentSlide.classList.remove('active');
    nextSlide.classList.add('active');

    // Atualiza os indicadores
    indicators[currentSlideIndex].classList.remove('active');
    indicators[newIndex].classList.add('active');

    // Atualiza o índice atual
    currentSlideIndex = newIndex;
}

// Adiciona eventos aos indicadores
indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => changeSlide(index));
});

// Inicia a música do primeiro slide
playMusic(slides[currentSlideIndex].dataset.music);

        class VerticalCarousel {
            constructor() {
                this.slides = document.querySelectorAll('.slide');
                this.indicators = document.querySelectorAll('.indicator');
                this.progressFill = document.querySelector('.progress-fill');
                this.currentSlide = 0;
                this.isTransitioning = false;
                this.audioContext = null;
                this.currentAudio = null;
                this.audioSources = new Map();
                this.isPlaying = true;
                this.isMuted = false;
                
                this.init();
            }

            

            async init() {
                await this.initAudio();
                this.setupEventListeners();
                this.loadSlideBackgrounds();
                this.startSlide(0);
            }

            async initAudio() {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    await this.loadAudioFiles();
                } catch (error) {
                    console.log('Áudio não suportado:', error);
                }
            }

            async loadAudioFiles() {
                const audioPromises = [];
                
                this.slides.forEach((slide, index) => {
                    const musicUrl = slide.dataset.music;
                    if (musicUrl) {
                        audioPromises.push(this.loadAudioFile(musicUrl, index));
                    }
                });

                try {
                    await Promise.all(audioPromises);
                } catch (error) {
                    console.log('Erro ao carregar arquivos de áudio:', error);
                    // Fallback para tons de demonstração se falhar
                    this.createDemoAudioForSlides();
                }
            }

            async loadAudioFile(url, index) {
                try {
                    const response = await fetch(url);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    
                    const gainNode = this.audioContext.createGain();
                    gainNode.connect(this.audioContext.destination);
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    
                    this.audioSources.set(index, { 
                        audioBuffer, 
                        gainNode, 
                        source: null,
                        isPlaying: false 
                    });
                } catch (error) {
                    console.log(`Erro ao carregar áudio do slide ${index}:`, error);
                    // Cria um tom de fallback para este slide
                    this.createDemoAudioForSlide(index);
                }
            }

            createDemoAudioForSlides() {
                const frequencies = [440, 523.25, 659.25, 783.99];
                frequencies.forEach((freq, index) => {
                    this.createDemoAudioForSlide(index, freq);
                });
            }

            createDemoAudioForSlide(index, frequency = 440) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                oscillator.type = 'sine';
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                
                this.audioSources.set(index, { oscillator, gainNode, isDemoAudio: true });
            }

            setupEventListeners() {
                // Mouse wheel
                document.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    if (this.isTransitioning) return;

                    if (e.deltaY > 0) {
                        this.nextSlide();
                    } else {
                        this.prevSlide();
                    }
                });

                // Indicadores
                this.indicators.forEach((indicator, index) => {
                    indicator.addEventListener('click', () => {
                        if (!this.isTransitioning && index !== this.currentSlide) {
                            this.goToSlide(index);
                        }
                    });
                });

                // Controles
                document.getElementById('playBtn').addEventListener('click', () => {
                    this.togglePlayPause();
                });

                document.getElementById('muteBtn').addEventListener('click', () => {
                    this.toggleMute();
                });

                // Teclado
                document.addEventListener('keydown', (e) => {
                    if (this.isTransitioning) return;
                    
                    switch(e.key) {
                        case 'ArrowDown':
                        case ' ':
                            e.preventDefault();
                            this.nextSlide();
                            break;
                        case 'ArrowUp':
                            e.preventDefault();
                            this.prevSlide();
                            break;
                    }
                });

                // Toque para mobile
                let startY = 0;
                document.addEventListener('touchstart', (e) => {
                    startY = e.touches[0].clientY;
                });

                document.addEventListener('touchend', (e) => {
                    if (this.isTransitioning) return;
                    
                    const endY = e.changedTouches[0].clientY;
                    const diff = startY - endY;

                    if (Math.abs(diff) > 50) {
                        if (diff > 0) {
                            this.nextSlide();
                        } else {
                            this.prevSlide();
                        }
                    }
                });
            }

            loadSlideBackgrounds() {
                this.slides.forEach((slide, index) => {
                    const bgType = slide.dataset.bgType;
                    const bgSrc = slide.dataset.bg;

                    if (bgType === 'image') {
                        slide.style.backgroundImage = `url(${bgSrc})`;
                    } else if (bgType === 'video') {
                        const video = slide.querySelector('.video-background');
                        if (video) {
                            video.src = bgSrc;
                        }
                    }
                });
            }

            nextSlide() {
                const next = (this.currentSlide + 1) % this.slides.length;
                this.goToSlide(next);
            }

            prevSlide() {
                const prev = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
                this.goToSlide(prev);
            }

            goToSlide(index) {
                if (this.isTransitioning || index === this.currentSlide) return;

                this.isTransitioning = true;
                const previousSlide = this.currentSlide;
                this.currentSlide = index;

                // Primeiro: Fade out do slide atual
                this.slides[previousSlide].style.opacity = '0';

                // Depois de um pequeno delay, fade in do próximo slide
                setTimeout(() => {
                    // Remove active de todos os slides
                    this.slides.forEach(slide => {
                        slide.classList.remove('active');
                    });

                    // Ativa o novo slide
                    this.slides[this.currentSlide].classList.add('active');
                    this.slides[this.currentSlide].style.opacity = '1';
                }, 400); // Meio da transição

                // Atualiza indicadores
                this.indicators.forEach((indicator, i) => {
                    indicator.classList.toggle('active', i === this.currentSlide);
                });

                // Atualiza barra de progresso
                const progress = ((this.currentSlide + 1) / this.slides.length) * 100;
                this.progressFill.style.width = `${progress}%`;

                // Transição de áudio
                this.transitionAudio(previousSlide, this.currentSlide);

                // Libera transição após animação completa
                setTimeout(() => {
                    this.isTransitioning = false;
                }, 800);
            }

            transitionAudio(fromSlide, toSlide) {
                if (!this.audioContext || this.isMuted) return;

                const fromAudio = this.audioSources.get(fromSlide);
                const toAudio = this.audioSources.get(toSlide);

                // Verifica se o áudio do slide atual é o mesmo do próximo slide
                if (fromAudio && toAudio && fromAudio.audioBuffer === toAudio.audioBuffer) {
                    // Se for o mesmo, não faz transição de áudio
                    return;
                }

                // Fade out do áudio anterior
                if (fromAudio && this.isPlaying) {
                    if (fromAudio.isDemoAudio) {
                        fromAudio.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
                    } else {
                        fromAudio.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
                        if (fromAudio.source) {
                            setTimeout(() => {
                                fromAudio.source.stop();
                                fromAudio.source = null;
                                fromAudio.isPlaying = false;
                            }, 500);
                        }
                    }
                }

                // Fade in do novo áudio
                if (toAudio && this.isPlaying) {
                    if (toAudio.isDemoAudio) {
                        toAudio.gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime);
                        toAudio.gainNode.gain.exponentialRampToValueAtTime(0.3, this.audioContext.currentTime + 0.5);
                    } else {
                        this.playAudioBuffer(toSlide);
                    }
                }
            }

            playAudioBuffer(slideIndex) {
    const audioData = this.audioSources.get(slideIndex);
    if (!audioData || !audioData.audioBuffer) return;

    // Para qualquer áudio que já esteja tocando
    this.audioSources.forEach((data, index) => {
        if (data.source && index !== slideIndex) {
            data.source.stop();
            data.source = null;
            data.isPlaying = false;
        }
    });

    // Verifica se o áudio já está tocando para evitar duplicação
    if (audioData.isPlaying) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioData.audioBuffer;
    source.connect(audioData.gainNode);
    source.loop = true;

    audioData.gainNode.gain.setValueAtTime(0.001, this.audioContext.currentTime);
    audioData.gainNode.gain.exponentialRampToValueAtTime(0.3, this.audioContext.currentTime + 0.5);

    source.start();
    audioData.source = source;
    audioData.isPlaying = true;

    source.onended = () => {
        audioData.source = null;
        audioData.isPlaying = false;
    };
}

            startSlide(index) {
                if (!this.audioContext) return;

                try {
                    // Inicia os osciladores de demonstração (só pode ser feito uma vez)
                    this.audioSources.forEach((audioData, i) => {
                        if (audioData.isDemoAudio && audioData.oscillator) {
                            audioData.oscillator.start();
                            if (i === index && this.isPlaying && !this.isMuted) {
                                audioData.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                            }
                        } else if (!audioData.isDemoAudio && i === index && this.isPlaying && !this.isMuted) {
                            this.playAudioBuffer(i);
                        }
                    });
                } catch (error) {
                    console.log('Erro ao iniciar áudio:', error);
                }
            }

            togglePlayPause() {
                this.isPlaying = !this.isPlaying;
                const btn = document.getElementById('playBtn');
                
                if (this.isPlaying) {
                    btn.textContent = '⏸️';
                    if (!this.isMuted) {
                        const currentAudio = this.audioSources.get(this.currentSlide);
                        if (currentAudio) {
                            currentAudio.gainNode.gain.exponentialRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
                        }
                    }
                } else {
                    btn.textContent = '▶️';
                    const currentAudio = this.audioSources.get(this.currentSlide);
                    if (currentAudio) {
                        currentAudio.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                    }
                }
            }

            toggleMute() {
                this.isMuted = !this.isMuted;
                const btn = document.getElementById('muteBtn');
                
                if (this.isMuted) {
                    btn.textContent = '🔇';
                    this.audioSources.forEach(audio => {
                        audio.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                    });
                } else {
                    btn.textContent = '🔊';
                    if (this.isPlaying) {
                        const currentAudio = this.audioSources.get(this.currentSlide);
                        if (currentAudio) {
                            currentAudio.gainNode.gain.exponentialRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
                        }
                    }
                }
            }
        }

        // Inicializa o carrossel quando a página carrega
        document.addEventListener('DOMContentLoaded', () => {
            // Aguarda interação do usuário para iniciar áudio (requerido pelos navegadores)
            document.addEventListener('click', function initAudio() {
                new VerticalCarousel();
                document.removeEventListener('click', initAudio);
            }, { once: true });

            // Fallback: inicia sem áudio se não houver clique
            setTimeout(() => {
                if (!window.carousel) {
                    new VerticalCarousel();
                }
            }, 1000);
        });