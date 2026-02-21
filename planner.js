const { ipcRenderer } = require('electron');

const mealName = document.getElementById("mealName");
const mealCategory = document.getElementById("mealCategory");
const mealCalories = document.getElementById("mealCalories");
const mealList = document.getElementById("mealList");
const totalCaloriesEl = document.getElementById("totalCalories");
const bestMealEl = document.getElementById("bestMeal");
const feedbackEl = document.getElementById("feedback");

let meals = [];
let selectedIndex = null;

/* FEEDBACK MESSAGE */
function showFeedback(msg) {
  feedbackEl.innerText = msg;
  feedbackEl.style.display = "block";

  setTimeout(() => {
    feedbackEl.style.display = "none";
  }, 2500);
}

/* AUTO-FILL SELECTED MEAL */
ipcRenderer.on('meal-data', (e, meal) => {
  mealName.value = meal.strMeal;
  mealCategory.value = meal.strCategory;
  mealCalories.value = estimateCalories(meal);
});

/* LOAD MEALS */
window.onload = async () => {
  meals = await ipcRenderer.invoke("load-meals");
  renderMeals();
};

/* SAVE MEAL */
document.getElementById("saveBtn").onclick = () => {
  const data = {
    name: mealName.value,
    category: mealCategory.value,
    calories: Number(mealCalories.value),
    vegetarian: mealCategory.value === "Vegetarian"
  };

  ipcRenderer.send("save-meal", data);
  meals.push(data);

  renderMeals();
  clearForm();
  showFeedback("✅ Meal saved successfully");
};

/* UPDATE MEAL */
document.getElementById("updateBtn").onclick = () => {
  if (selectedIndex === null) return;

  const data = {
    name: mealName.value,
    category: mealCategory.value,
    calories: Number(mealCalories.value),
    vegetarian: mealCategory.value === "Vegetarian"
  };

  ipcRenderer.send("update-meal", { index: selectedIndex, data });
  meals[selectedIndex] = data;

  renderMeals();
  showFeedback("✏️ Meal updated");
};

/* DELETE MEAL */
document.getElementById("deleteBtn").onclick = () => {
  if (selectedIndex === null) return;

  if (!confirm("Are you sure you want to delete this meal?")) return;

  ipcRenderer.send("delete-meal", selectedIndex);
  meals.splice(selectedIndex, 1);

  renderMeals();
  clearForm();
  showFeedback("🗑 Meal deleted");
};

/* DISPLAY MEAL INFO */
function renderMeals() {
  mealList.innerHTML = "";

  meals.sort((a, b) => b.calories - a.calories);

  meals.forEach((m, i) => {
    mealList.innerHTML += `
      <div class="meal-card">
        <h3>${m.name}</h3>
        <p><b>Category:</b> ${m.category}</p>
        <p><b>Calories:</b> ${m.calories} kcal</p>
        <p>${m.vegetarian ? "🥦 Vegetarian" : "🍖 Non-Vegetarian"}</p>
        <button onclick="selectMeal(${i})">Select</button>
        <button onclick="viewMeal(${i})">View</button>
      </div>
    `;
  });

  updateSummary();
}

/* PLANNER SUMMARY */
function updateSummary() {
  const total = meals.reduce((sum, m) => sum + m.calories, 0);
  totalCaloriesEl.innerText = total;

  if (meals.length > 0) {
    const best = meals.reduce((min, m) => m.calories < min.calories ? m : min, meals[0]);
    bestMealEl.innerText = `${best.name} (${best.calories} kcal)`;
  } else {
    bestMealEl.innerText = "-";
  }
}

/* SELECT MEAL */
function selectMeal(i) {
  selectedIndex = i;
  mealName.value = meals[i].name;
  mealCategory.value = meals[i].category;
  mealCalories.value = meals[i].calories;
}

/* UTILITIES */
function clearForm() {
  mealName.value = "";
  mealCategory.value = "";
  mealCalories.value = "";
  selectedIndex = null;
}

function estimateCalories(meal) {
  let count = 0;
  for (let i = 1; i <= 20; i++) {
    if (meal[`strIngredient${i}`]) count++;
  }
  return count * 45;
}

function viewMeal(index) {
  const mealName = meals[index].name;

  fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${mealName}`)
    .then(r => r.json())
    .then(data => {
      if (!data.meals) {
        alert("Meal details not found.");
        return;
      }

      const meal = data.meals[0];

      let ingredientsHTML = "<ul>";
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const meas = meal[`strMeasure${i}`];
        if (ing && ing.trim()) {
          ingredientsHTML += `<li>${meas || ""} ${ing}</li>`;
        }
      }
      ingredientsHTML += "</ul>";

      feedbackEl.innerHTML = `
        <h3>${meal.strMeal}</h3>
        <img src="${meal.strMealThumb}" width="220">
        <h4>Ingredients</h4>
        ${ingredientsHTML}
        <h4>Instructions</h4>
        <p>${meal.strInstructions}</p>
      `;

      feedbackEl.style.display = "block";
    });
}