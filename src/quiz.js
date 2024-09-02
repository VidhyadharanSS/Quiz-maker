document.addEventListener('DOMContentLoaded', () => {
    // Function to start the quiz based on selected category
    window.startQuiz = function () {
      const category = document.getElementById('categorySelect').value;
      fetchQuiz(category);
    };
  
    function fetchQuiz(category) {
      // Example URL, replace with actual API endpoint
      const apiUrl = `https://example.com/api/quiz?category=${category}`;
      
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          displayQuiz(data);
        })
        .catch(error => console.error('Error fetching quiz:', error));
    }
  
    function displayQuiz(data) {
      const quizContainer = document.getElementById('quizContainer');
      quizContainer.innerHTML = ''; // Clear previous quiz content
  
      // Generate quiz questions and options
      data.questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'mb-4';
  
        questionElement.innerHTML = `
          <h3>Question ${index + 1}</h3>
          <p>${question.question}</p>
          ${question.options.map((option, i) => `
            <div class="form-check">
              <input class="form-check-input" type="radio" name="question${index}" id="option${index}-${i}" value="${option}">
              <label class="form-check-label" for="option${index}-${i}">
                ${option}
              </label>
            </div>
          `).join('')}
        `;
  
        quizContainer.appendChild(questionElement);
      });
  
      // Show the quiz container
      quizContainer.classList.remove('d-none');
    }
  });
  