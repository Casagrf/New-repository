document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  async function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = details.participants.length
          ? `<ul class="participants-list">${details.participants
              .map(
                (p) =>
                  `<li class="participant-item">${p}<button class="delete-participant" data-activity="${encodeURIComponent(
                    name
                  )}" data-email="${encodeURIComponent(p)}" aria-label="Unregister ${p}">✕</button></li>`
              )
              .join("")}</ul>`
          : `<p class="participants-empty">No participants yet.</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-participant").forEach((button) => {
        button.addEventListener("click", async () => {
          const activity = decodeURIComponent(button.dataset.activity);
          const email = decodeURIComponent(button.dataset.email);

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
              {
                method: "DELETE",
              }
            );

            const result = await response.json();
            if (response.ok) {
              await showMessage(result.message, "success");
              await fetchActivities();
            } else {
              await showMessage(result.detail || "Unable to unregister", "error");
            }
          } catch (error) {
            await showMessage("Network error unregistering participant", "error");
            console.error("Error unregistering participant:", error);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();
      if (response.ok) {
        await showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        await showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      await showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});
