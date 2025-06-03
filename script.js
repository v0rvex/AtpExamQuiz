document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const questionsTabBtn = document.getElementById('questions-tab');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Subject switching
    const subjectBtns = document.querySelectorAll('.subject-btn');
    const quizTitle = document.getElementById('quiz-title');
    let currentSubject = 'pm3';
    
    subjectBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const subject = this.getAttribute('data-subject');
            
            // Remove active class from all buttons
            subjectBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current subject
            currentSubject = subject;
            quizTitle.textContent = this.textContent;
            
            // Reload questions for new subject
            loadQuestions();
        });
    });
    
    // Quiz variables
    let questions = [];
    let currentQuestionIndex = 0;
    let selectedAnswers = [];
    let correctAnswersCount = 0;
    let incorrectAnswersCount = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let quizActive = false;
    let selectedQuestions = [];
    let answerSelected = false;
    
    // DOM elements
    const quizSettings = document.getElementById('quiz-settings');
    const quizContainer = document.getElementById('quiz-container');
    const resultsContainer = document.getElementById('results-container');
    const startQuizBtn = document.getElementById('start-quiz');
    const restartBtn = document.getElementById('restart-btn');
    const allQuestionsCheckbox = document.getElementById('all-questions');
    const questionCountInput = document.getElementById('question-count');
    
    // Load questions from JSON
    function loadQuestions() {
        fetch(`${currentSubject}.json`)
            .then(res => {
                if (!res.ok) throw new Error('Не удалось загрузить вопросы');
                return res.json();
            })
            .then(data => {
                questions = data;
                populateQuestionsTable();
            })
            .catch(err => {
                console.error('Ошибка загрузки:', err);
                questions = [];
                populateQuestionsTable();
                alert('Не удалось загрузить вопросы для выбранного предмета');
            });
    }
    
    // Populate questions table
    function populateQuestionsTable() {
        const tableBody = document.getElementById('questions-table-body');
        tableBody.innerHTML = '';
        
        questions.forEach((q, index) => {
            const row = document.createElement('tr');
            
            const numberCell = document.createElement('td');
            numberCell.textContent = index + 1;
            
            const questionCell = document.createElement('td');
            questionCell.textContent = q.question;
            
            const answerCell = document.createElement('td');
            answerCell.textContent = q.answer;
            
            row.appendChild(numberCell);
            row.appendChild(questionCell);
            row.appendChild(answerCell);
            
            tableBody.appendChild(row);
        });
    }
    
    // Start quiz
    startQuizBtn.addEventListener('click', function() {
        const useAllQuestions = allQuestionsCheckbox.checked;
        let questionCount = useAllQuestions ? questions.length : parseInt(questionCountInput.value);
        
        if (questionCount < 1) questionCount = 1;
        if (questionCount > questions.length) questionCount = questions.length;
        
        // Reset quiz state
        currentQuestionIndex = 0;
        selectedAnswers = [];
        correctAnswersCount = 0;
        incorrectAnswersCount = 0;
        currentStreak = 0;
        maxStreak = 0;
        quizActive = true;
        answerSelected = false;
        
        // Disable questions tab
        questionsTabBtn.disabled = true;
        
        // Select random questions if not using all
        let quizQuestions;
        if (useAllQuestions) {
            quizQuestions = [...questions];
        } else {
            // Shuffle array and pick first N questions
            quizQuestions = [...questions].sort(() => 0.5 - Math.random()).slice(0, questionCount);
        }
        
        // Store selected questions
        selectedQuestions = quizQuestions;
        
        // Show quiz container
        quizSettings.style.display = 'none';
        quizContainer.style.display = 'block';
        resultsContainer.style.display = 'none';
        
        // Load first question
        loadQuestion(currentQuestionIndex);
    });
    
    // Load question
    function loadQuestion(index) {
        if (index >= selectedQuestions.length) {
            showResults();
            return;
        }

        answerSelected = false;
        const question = selectedQuestions[index];
        document.getElementById('question').textContent = question.question;
        document.getElementById('progress').textContent = `Вопрос ${index + 1} из ${selectedQuestions.length}`;

        // Prepare answers (correct + wrong)
        const answers = [question.answer, ...question.wrong_answers];

        // Shuffle answers
        const shuffledAnswers = answers.sort(() => 0.5 - Math.random());

        // Display answers
        const answersContainer = document.getElementById('answers');
        answersContainer.innerHTML = '';

        shuffledAnswers.forEach(answer => {
            const answerBtn = document.createElement('button');
            answerBtn.className = 'answer-btn';
            answerBtn.textContent = answer;
            
            answerBtn.addEventListener('click', function() {
                if (answerSelected) return;
                answerSelected = true;
                
                const isCorrect = this.textContent === question.answer;
                const answerButtons = document.querySelectorAll('.answer-btn');
                
                // 1. Скрываем все ответы, кроме выбранного
                answerButtons.forEach(btn => {
                    if (btn !== this) {
                        btn.style.opacity = '0';
                        btn.style.transition = 'opacity 0.3s ease';
                    }
                });
                
                // 2. Подсвечиваем выбранный ответ (зеленый/красный)
                this.classList.add(isCorrect ? 'correct' : 'incorrect');
                
                // 3. Через 1 секунду показываем все ответы с правильной подсветкой
                setTimeout(() => {
                    answerButtons.forEach(btn => {
                        if (btn !== this) {
                            btn.style.opacity = '1';
                        }
                        
                        // Подсвечиваем правильные/неправильные ответы
                        if (btn.textContent === question.answer) {
                            btn.classList.add('correct');
                        } else if (btn.textContent !== this.textContent) {
                            btn.classList.add('incorrect');
                        }
                    });
                    
                    // 4. Через 1.5 секунды переходим к следующему вопросу
                    setTimeout(() => {
                        // Store selected answer
                        selectedAnswers[index] = this.textContent;
                        
                        if (isCorrect) {
                            correctAnswersCount++;
                            currentStreak++;
                            if (currentStreak > maxStreak) maxStreak = currentStreak;
                        } else {
                            incorrectAnswersCount++;
                            currentStreak = 0;
                        }
                        
                        currentQuestionIndex++;
                        loadQuestion(currentQuestionIndex);
                    }, 1500);
                }, 1000);
            });
        
            answersContainer.appendChild(answerBtn);
        });
    }
    
    // Show results
    function showResults() {
        quizActive = false;
        questionsTabBtn.disabled = false;
        
        quizContainer.style.display = 'none';
        resultsContainer.style.display = 'block';
        
        // Display stats
        document.getElementById('correct-answers').textContent = correctAnswersCount;
        document.getElementById('incorrect-answers').textContent = incorrectAnswersCount;
        document.getElementById('streak').textContent = maxStreak;
        document.getElementById('percentage').textContent = 
            Math.round((correctAnswersCount / selectedQuestions.length) * 100) + '%';
        
        // Display answers review
        const answersReview = document.getElementById('answers-review');
        answersReview.innerHTML = '<h3>Проверка ответов:</h3>';
        
        selectedQuestions.forEach((question, index) => {
            const userAnswer = selectedAnswers[index];
            const isCorrect = userAnswer === question.answer;
            
            const answerItem = document.createElement('div');
            answerItem.className = `answer-item ${isCorrect ? 'correct' : 'incorrect'}`;
            
            const questionText = document.createElement('div');
            questionText.textContent = `${index + 1}. ${question.question}`;
            questionText.style.fontWeight = '600';
            
            const userAnswerText = document.createElement('div');
            userAnswerText.className = 'user-answer';
            userAnswerText.textContent = `Ваш ответ: ${userAnswer}`;
            
            const correctAnswerText = document.createElement('div');
            correctAnswerText.className = 'correct-answer';
            correctAnswerText.textContent = `Правильный ответ: ${question.answer}`;
            
            answerItem.appendChild(questionText);
            answerItem.appendChild(userAnswerText);
            
            if (!isCorrect) {
                answerItem.appendChild(correctAnswerText);
            }
            
            answersReview.appendChild(answerItem);
        });
    }
    
    // Restart quiz
    restartBtn.addEventListener('click', function() {
        resultsContainer.style.display = 'none';
        quizSettings.style.display = 'block';
        quizActive = false;
        questionsTabBtn.disabled = false;
    });
    
    // Toggle all questions checkbox
    allQuestionsCheckbox.addEventListener('change', function() {
        questionCountInput.disabled = this.checked;
    });
    
    // Initialize
    loadQuestions();
});