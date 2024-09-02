import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
import { Howl } from 'howler';
import tickSound from './tick-sound.mp3';
import {
  FacebookShareButton,
  LinkedinShareButton,
  FacebookIcon,
  LinkedinIcon
} from 'react-share';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  const [quizData, setQuizData] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [numQuestions, setNumQuestions] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionType, setQuestionType] = useState("multiple");
  const [timeLeft, setTimeLeft] = useState(30);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [customQuiz, setCustomQuiz] = useState([]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customOptions, setCustomOptions] = useState(["", "", "", ""]);
  const [customCorrectAnswer, setCustomCorrectAnswer] = useState("");

  useEffect(() => {
    if (!creatingQuiz && selectedCategory && numQuestions && difficulty && questionType) {
      const fetchQuizData = async () => {
        try {
          const response = await axios.get(
            `https://opentdb.com/api.php?amount=${numQuestions}&category=${selectedCategory}&difficulty=${difficulty}&type=${questionType}`
          );
          setQuizData(response.data.results);
          shuffleOptions(response.data.results[0]);
        } catch (error) {
          console.error("Error fetching quiz data:", error);
        }
      };

      fetchQuizData();
    } else if (creatingQuiz) {
      setQuizData(customQuiz);
      shuffleOptions(customQuiz[0]);
    }
  }, [selectedCategory, numQuestions, difficulty, questionType, customQuiz]);

  const sound = new Howl({
    src: [tickSound],
    loop: true,
    volume: 0.5,
  });
  
  useEffect(() => {
    if (timeLeft > 0) {
      sound.play();
    } else {
      sound.stop();
    }
  
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
    }, 1000);
  
    return () => {
      clearInterval(timer);
      sound.stop();
    };
  }, [timeLeft]);

  useEffect(() => {
    if (quizData.length > 0) {
      shuffleOptions(quizData[currentQuestion]);
    }
  }, [currentQuestion, quizData]);

  const shuffleOptions = (question) => {
    const options = [...question.incorrect_answers, question.correct_answer];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    setShuffledOptions(options);
  };

  const handleAnswerOptionClick = (answer) => {
    const isCorrect = answer === quizData[currentQuestion]?.correct_answer;
    setUserAnswers((prevAnswers) => [
      ...prevAnswers,
      {
        question: quizData[currentQuestion].question,
        userAnswer: answer,
        correctAnswer: quizData[currentQuestion].correct_answer,
      },
    ]);
  
    if (isCorrect) {
      setScore(score + 1);
    }
  
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < quizData.length) {
      setCurrentQuestion(nextQuestion);
      setTimeLeft(30);
    } else {
      setShowScore(true);
    }
  
    // Apply animation classes
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach((button) => {
      if (button.textContent === answer) {
        button.classList.add(isCorrect ? 'correct' : 'incorrect');
      }
    });
    setTimeout(() => {
      optionButtons.forEach((button) => button.classList.remove('correct', 'incorrect'));
    }, 1000);
  };
  
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleNumQuestionsChange = (event) => {
    setNumQuestions(event.target.value);
  };

  const handleDifficultyChange = (event) => {
    setDifficulty(event.target.value);
  };

  const handleQuestionTypeChange = (event) => {
    setQuestionType(event.target.value);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Quiz Results", 10, 10);
    doc.text(`You scored ${score} out of ${quizData.length}`, 10, 20);

    userAnswers.forEach((answer, index) => {
      const yOffset = 30 + index * 40;
      doc.text(`Question ${index + 1}: ${answer.question}`, 10, yOffset);
      doc.text(`Your Answer: ${answer.userAnswer || 'Not Answered'}`, 10, yOffset + 10);
      doc.text(`Correct Answer: ${answer.correctAnswer}`, 10, yOffset + 20);
    });

    doc.save("quiz_results.pdf");
  };

  const getResultEmoji = () => {
    if (score === quizData.length) return "🎉 Excellent!";
    if (score >= quizData.length / 2) return "😊 Good job!";
    return "😞 Better luck next time!";
  };

  const getEmojiForQuestion = () => {
    if (currentQuestion % 2 === 0) return "🤔";
    return "💡";
  };

  const isQuizReady = () => selectedCategory && numQuestions && difficulty && questionType;

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setTimeLeft(30);
    setUserAnswers([]);
    setShowHint(false);
  };

  const getHint = () => {
    if (quizData.length > 0) {
      const hint = `The correct answer is one of these: ${shuffledOptions.join(", ")}`;
      return hint;
    }
    return "No hint available";
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const getChartData = () => {
    const data = {
      labels: quizData.map((_, index) => `Question ${index + 1}`),
      datasets: [
        {
          label: "User Answers",
          data: userAnswers.map(answer => answer.userAnswer === answer.correctAnswer ? 1 : 0),
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
    return data;
  };

  const addCustomQuestion = () => {
    const newQuestion = {
      question: customQuestion,
      incorrect_answers: customOptions.filter(option => option !== customCorrectAnswer),
      correct_answer: customCorrectAnswer,
    };

    setCustomQuiz([...customQuiz, newQuestion]);
    setCustomQuestion("");
    setCustomOptions(["", "", "", ""]);
    setCustomCorrectAnswer("");
  };

  const handleCustomOptionChange = (index, value) => {
    const updatedOptions = [...customOptions];
    updatedOptions[index] = value;
    setCustomOptions(updatedOptions);
  };

  return (
    <div className={`app ${darkMode ? "dark-mode" : ""}`}>
      <div className="container">
        <div className="progress mt-4">
          <div
            className="progress-bar"
            role="progressbar"
            style={{
              width: `${((currentQuestion + 1) / quizData.length) * 100}%`,
              transition: "width 0.5s ease-in-out",
            }}
            aria-valuenow={(currentQuestion + 1)}
            aria-valuemin="0"
            aria-valuemax={quizData.length}
          >
            {currentQuestion + 1}/{quizData.length}
          </div>
        </div>

        {quizData.length === 0 ? (
          <div className="loading">Loading quiz...</div>
        ) : (
          <div className="quiz-section">
            {showScore ? (
              <div className="alert alert-success text-center score-section">
                <h4>{getResultEmoji()}</h4>
                <h5>You scored {score} out of {quizData.length}</h5>
                <button className="btn btn-primary mt-3" onClick={generatePDF}>
                  Download Results as PDF
                </button>
                <button className="btn btn-secondary mt-3" onClick={handleRetakeQuiz}>
                  Retake Quiz
                </button>

                <div className="mt-3">
                  <FacebookShareButton url={"http://localhost:3000"}>
                    <FacebookIcon size={32} round={true} />
                  </FacebookShareButton>
                  <LinkedinShareButton url={"http://localhost:3000"} className="ml-2">
                    <LinkedinIcon size={32} round={true} />
                  </LinkedinShareButton>
                </div>

                <div className="mt-4">
                  <h6>Quiz Analytics</h6>
                  <Bar data={getChartData()} />
                </div>
              </div>
            ) : (
              <div className="question-section">
                <div className="question-count">
                  <span>Question {currentQuestion + 1}</span>/{quizData.length}
                </div>
                <div className="question-text">{quizData[currentQuestion].question}</div>
                <div className="hint-section">
                  <button
                    className="btn btn-info mt-2"
                    onClick={() => setShowHint(!showHint)}
                  >
                    {showHint ? "Hide Hint" : "Show Hint"}
                  </button>
                  {showHint && <div className="hint-text mt-2">{getHint()}</div>}
                </div>
                <div className="options-section">
                  {shuffledOptions.map((option, index) => (
                    <button
                      key={index}
                      className="btn btn-primary option-btn mt-3"
                      onClick={() => handleAnswerOptionClick(option)}
                    >
                      {getEmojiForQuestion()} {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="settings-section mt-5">
          <button
            className="btn btn-secondary"
            onClick={handleDarkModeToggle}
          >
            Toggle {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          {!creatingQuiz && (
            <div className="quiz-settings mt-4">
              <h4>Create Your Own Quiz</h4>
              <button
                className="btn btn-primary mt-3"
                onClick={() => setCreatingQuiz(true)}
              >
                Create Custom Quiz
              </button>
            </div>
          )}

          {creatingQuiz && (
            <div className="custom-quiz-section mt-4">
              <h5>Custom Quiz</h5>
              <div className="form-group">
                <label>Question</label>
                <input
                  type="text"
                  className="form-control"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                />
              </div>
              {customOptions.map((option, index) => (
                <div className="form-group" key={index}>
                  <label>Option {index + 1}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={option}
                    onChange={(e) => handleCustomOptionChange(index, e.target.value)}
                  />
                </div>
              ))}
              <div className="form-group">
                <label>Correct Answer</label>
                <input
                  type="text"
                  className="form-control"
                  value={customCorrectAnswer}
                  onChange={(e) => setCustomCorrectAnswer(e.target.value)}
                />
              </div>
              <button
                className="btn btn-success mt-3"
                onClick={addCustomQuestion}
              >
                Add Question
              </button>
              <button
                className="btn btn-danger mt-3 ml-3"
                onClick={() => setCreatingQuiz(false)}
              >
                Cancel
              </button>
            </div>
          )}

          {!creatingQuiz && (
            <div className="quiz-settings mt-4">
              <h4>Quiz Settings</h4>
              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-control"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                >
                  <option value="">Select Category</option>
                  <option value="9">General Knowledge</option>
                  <option value="21">Sports</option>
                  <option value="23">History</option>
                  <option value="18">Science: Computers</option>
                  <option value="17">Science: Nature</option>
                </select>
              </div>
              <div className="form-group">
                <label>Number of Questions</label>
                <input
                  type="number"
                  className="form-control"
                  value={numQuestions}
                  onChange={handleNumQuestionsChange}
                  min="1"
                  max="50"
                />
              </div>
              <div className="form-group">
                <label>Difficulty</label>
                <select
                  className="form-control"
                  value={difficulty}
                  onChange={handleDifficultyChange}
                >
                  <option value="">Select Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  className="form-control"
                  value={questionType}
                  onChange={handleQuestionTypeChange}
                >
                  <option value="multiple">Multiple Choice</option>
                  <option value="boolean">True/False</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

