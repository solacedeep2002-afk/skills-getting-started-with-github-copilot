document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select before repopulating to avoid duplicates
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (bulleted list or a placeholder)
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = `
            <div class="participants">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (p) =>
                      `<li><span class="participant-name">${p}</span><button class="participant-remove" data-activity="${encodeURIComponent(
                        name
                      )}" data-email="${encodeURIComponent(p)}" title="Remove participant">\u00d7</button></li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHtml = `
            <div class="participants">
              <strong>Participants:</strong>
              <p class="no-participants">No participants yet.</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
    // Refresh activities so participant list updates
    await fetchActivities();
  });

  // Delegate click events for participant remove buttons
  activitiesList.addEventListener("click", async (ev) => {
    const btn = ev.target.closest && ev.target.closest(".participant-remove");
    if (!btn) return;

    const activity = decodeURIComponent(btn.dataset.activity);
    const email = decodeURIComponent(btn.dataset.email);

    if (!activity || !email) return;

    // Confirm before removing
    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const resp = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const j = await resp.json().catch(() => ({}));

      if (resp.ok) {
        // Remove the list item from the UI
        const li = btn.closest("li");
        if (li) li.remove();
      } else {
        alert(j.detail || j.message || "Failed to unregister participant");
      }

      // Refresh to ensure counts and lists are accurate
      await fetchActivities();
    } catch (err) {
      console.error("Error unregistering participant:", err);
      alert("Failed to unregister participant. Please try again.");
    }
  });

  // Initialize app
  fetchActivities();
});
