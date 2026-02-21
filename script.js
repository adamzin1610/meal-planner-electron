const { ipcRenderer } = require('electron');

// Properties needed
const resultDiv = document.getElementById('result');
const planBtn = document.getElementById('planBtn');
const categorySelect = document.getElementById('categorySelect');
const searchCategoryBtn = document.getElementById('searchCategoryBtn');
const searchBtn = document.getElementById('searchBtn');
const mealInput = document.getElementById('mealInput');
const vegOnly = document.getElementById('vegOnly');

let selectedMeal = null;

// LOAD DEFAULT
window.onload = () => {
  loadRandomMeals();
  loadCategories();
};

// RANDOM MEALS AT START
function loadRandomMeals() {
  const requests = [];

  for (let i = 0; i < 6; i++) {
    requests.push(
      fetch("https://www.themealdb.com/api/json/v1/1/random.php")
        .then(r => r.json())
        .then(data => data.meals[0])
    );
  }

  Promise.all(requests).then(meals => showCards(meals));
}

// CATEGORY LIST
function loadCategories() {
  categorySelect.innerHTML = "<option value=''>-- Select Category --</option>";

  fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list")
    .then(r => r.json())
    .then(data => {
      data.meals.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.strCategory;
        opt.textContent = c.strCategory;
        categorySelect.appendChild(opt);
      });
    });
}

// SEARCH BY MEAL NAME
searchBtn.addEventListener("click", () => {
  const name = mealInput.value.trim();
  if (!name) return;

  // CLEAR CATEGORY SEARCH
  categorySelect.value = "";

  resultDiv.innerHTML = "";
  planBtn.style.display = "none";
  document.getElementById("popularMeals").innerHTML = "";

  fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${name}`)
    .then(r => r.json())
    .then(data => {
      if (!data.meals) return;
      showCards(filterVeg(data.meals));
    });
});

// SEARCH BY CATEGORY
searchCategoryBtn.addEventListener("click", () => {
  const category = categorySelect.value;
  if (!category) return;

  // CLEAR NAME SEARCH
  mealInput.value = "";

  resultDiv.innerHTML = "";
  planBtn.style.display = "none";
  document.getElementById("popularMeals").innerHTML = "";

  fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`)
    .then(r => r.json())
    .then(data => showCards(data.meals));
});

// SHOW MEAL CARDS
function showCards(meals) {
  const container = document.getElementById("popularMeals");
  container.innerHTML = "";

  meals.forEach(m => {
    container.innerHTML += `
      <div class="meal-card">
        <img src="${m.strMealThumb}" width="130">
        <h3>${m.strMeal}</h3>
        <button onclick='viewMeal("${m.idMeal}")'>View</button>
      </div>
    `;
  });
}

// VIEW MEAL DETAILS
function viewMeal(id) {
  document.getElementById("popularMeals").innerHTML = "";
  resultDiv.innerHTML = "";

  fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`)
    .then(r => r.json())
    .then(data => displayMeal(data.meals[0]));
}

// DISPLAY DETAILS
function displayMeal(meal) {
  selectedMeal = meal;

  const calories = calculateCalories(meal);

  let ingredientsHTML = "<h3>Ingredients</h3><ul>";
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const meas = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      ingredientsHTML += `<li>${meas || ""} ${ing}</li>`;
    }
  }
  ingredientsHTML += "</ul>";

  resultDiv.innerHTML = `
    <button onclick="backToMeals()">⬅ Back</button>
    <h2>${meal.strMeal}</h2>
    <img src="${meal.strMealThumb}" width="250">
    <p><b>Category:</b> ${meal.strCategory}</p>
    <p><b>Estimated Calories:</b> ${calories} kcal</p>
    ${ingredientsHTML}
    <h3>Instructions</h3>
    <p>${meal.strInstructions}</p>
  `;

  planBtn.style.display = "inline-block";
}

// BACK BUTTON
function backToMeals() {
  resultDiv.innerHTML = "";
  planBtn.style.display = "none";
  loadRandomMeals();
}

// VEGETARIAN FILTER
function filterVeg(meals) {
  if (!vegOnly.checked) return meals;
  return meals.filter(m => m.strCategory === "Vegetarian");
}

// CALORIES CALCULATION
function calculateCalories(meal) {
  let ingredients = 0;
  for (let i = 1; i <= 20; i++) {
    if (meal[`strIngredient${i}`]) ingredients++;
  }
  return ingredients * 45;
}

// VIEW SAVED MEALS 
document.getElementById("viewSavedMealsBtn").addEventListener("click", () => {
  ipcRenderer.send("open-planner");
});

// SAVE MEAL 
planBtn.addEventListener("click", () => {
  ipcRenderer.send("open-planner", selectedMeal);
});