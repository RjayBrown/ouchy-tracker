const client = new Appwrite.Client()
	.setEndpoint("https://cloud.appwrite.io/v1")
	.setProject(import.meta.env.VITE_PROJECT_ID);

const databases = new Appwrite.Databases(client);

const resetBtn = document.querySelector(".reset");
const counterBtn = document.querySelector(".add");
const toggleBtn = document.querySelectorAll(".toggle-list");
const form = document.querySelector(".pain-form");
const count = document.querySelector(".count");
const streak = document.querySelector(".streak");
const painList = document.querySelector(".pain-list");
const painContainer = document.querySelector(".pain-container");

streak.textContent = localStorage.getItem("streak") || 0;

addPainfulEventToDom();

counterBtn.addEventListener("click", increaseCount);
form.addEventListener("submit", addPainToDB);

toggleBtn.forEach((btn) => {
	btn.addEventListener("click", togglePainList);
});

function togglePainList() {
	if (painContainer.classList.contains("show")) {
		painContainer.classList.remove("show");
		painContainer.classList.add("hide");
	} else if (painContainer.classList.contains("hide")) {
		painContainer.classList.remove("hide");
		painContainer.classList.add("show");
	}
}

function increaseCount() {
	count.textContent = +count.textContent + 1;
}

async function addPainToDB(e) {
	e.preventDefault();
	const promise = await databases.createDocument(
		import.meta.env.VITE_DATABASE_ID,
		import.meta.env.VITE_PAIN_COLLECTION_ID,
		Appwrite.ID.unique(),
		{
			event: e.target.eventDescription.value,
			date: e.target.eventDate.value,
			"pain-level": Number(e.target.painLevel.value),
		}
	);
	await addPainfulEventToDom();
	await addStreakToDB();
	form.reset();
	form.classList.add("hidden");
	count.textContent = 0;
}

async function addPainfulEventToDom() {
	painList.innerHTML = "";
	let response = await databases.listDocuments(
		import.meta.env.VITE_DATABASE_ID, // databaseId
		import.meta.env.VITE_PAIN_COLLECTION_ID // collectionId
	);

	response.documents.forEach((painEvent) => {
		const li = document.createElement("li");
		li.innerHTML = `${painEvent.event.toUpperCase()} on ${
			new Date(painEvent.date).toLocaleString().split(",")[0]
		} <br> PAIN LEVEL - ${painEvent["pain-level"]}<br>`;
		painList.appendChild(li);
		li.id = painEvent.$id;

		const deleteBtn = document.createElement("button");
		deleteBtn.classList.add("delete");
		deleteBtn.textContent = "Forget it ever happened!";
		deleteBtn.onclick = () => removeEvent(painEvent.$id);
		li.appendChild(deleteBtn);
	});

	async function removeEvent(id) {
		const result = await databases.deleteDocument(
			import.meta.env.VITE_DATABASE_ID, // databaseId
			import.meta.env.VITE_PAIN_COLLECTION_ID, // collectionId
			id // documentId
		);

		document.getElementById(id).remove();
		location.reload();
	}
}

resetBtn.addEventListener("click", showForm);

function showForm() {
	if (form.classList.contains("hidden")) {
		form.classList.remove("hidden");
	}
}

async function addStreakToDB() {
	const promise = await databases.createDocument(
		import.meta.env.VITE_DATABASE_ID,
		import.meta.env.VITE_STREAK_COLLECTION_ID,
		Appwrite.ID.unique(),
		{
			"streak-length": +count.textContent,
		}
	);
	updateLongestStreak();
}

async function updateLongestStreak() {
	let response = await databases.listDocuments(
		import.meta.env.VITE_DATABASE_ID,
		import.meta.env.VITE_STREAK_COLLECTION_ID
	);

	function sortArrayOfObjects(arr, property) {
		arr.sort((a, b) => {
			if (b[property] < a[property]) {
				return -1;
			}
			if (b[property] > a[property]) {
				return 1;
			}
			return 0;
		});
		return arr;
	}

	let streaksArr = response.documents;
	const sorted = sortArrayOfObjects(streaksArr, "streak-length");
	let longestStreak = sorted[0]["streak-length"];

	console.log(sorted);
	streak.textContent = longestStreak;
	localStorage.setItem("streak", longestStreak);
}
