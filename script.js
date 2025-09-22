let users = JSON.parse(localStorage.getItem("users") || "[]");
let complaints = JSON.parse(localStorage.getItem("complaints") || "[]");
let loggedUser = localStorage.getItem("loggedUser") || null;
let complaintsChart = null;

function switchTab(tab) {
  const protectedTabs = ["register", "dashboard", "admin"];
  if (protectedTabs.includes(tab) && !loggedUser) {
    alert("Please login to access this page");
    tab = "login";
  }
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tab).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  const btn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
  if (btn) btn.classList.add("active");
  if (tab === "dashboard") renderUserComplaints();
  if (tab === "admin") renderAdminComplaints();
  updateStats();
  showUserInfo();
}

document.querySelectorAll(".nav-btn").forEach(btn =>
  btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab")))
);

document.getElementById("logout-btn").onclick = () => {
  loggedUser = null;
  localStorage.removeItem("loggedUser");
  showUserInfo();
  switchTab("home");
};

function showUserInfo() {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  if (!loggedUser) {
    userInfo.textContent = "";
    logoutBtn.style.display = "none";
  } else {
    const usr = users.find(u => u.mob === loggedUser);
    userInfo.textContent = usr ? `Logged in as: ${usr.name}, ${usr.village}` : "Logged in";
    logoutBtn.style.display = "block";
  }
}

document.getElementById("signup-btn").onclick = () => {
  const name = document.getElementById("signup-name").value.trim();
  const village = document.getElementById("signup-village").value.trim();
  const age = Number(document.getElementById("signup-age").value);
  const mob = document.getElementById("signup-mobile").value.trim();
  const pwd = document.getElementById("signup-password").value;
  const msg = document.getElementById("signup-msg");

  if (!name || !village || !age || !mob || !pwd) {
    msg.style.color = "red";
    msg.textContent = "Please fill all fields";
    return;
  }
  if (users.some(u => u.mob === mob)) {
    msg.style.color = "orange";
    msg.textContent = "User already exists";
    return;
  }
  users.push({ name, village, age, mob, pwd });
  localStorage.setItem("users", JSON.stringify(users));
  msg.style.color = "green";
  msg.textContent = "Account created! Please login.";
  ["signup-name","signup-village","signup-age","signup-mobile","signup-password"].forEach(id => document.getElementById(id).value = "");
};

document.getElementById("login-btn").onclick = () => {
  const mob = document.getElementById("login-mobile").value.trim();
  const pwd = document.getElementById("login-password").value;
  const msg = document.getElementById("login-msg");
  const user = users.find(u => u.mob === mob && u.pwd === pwd);
  if (user) {
    loggedUser = mob;
    localStorage.setItem("loggedUser", mob);
    msg.style.color = "green";
    msg.textContent = `Welcome ${user.name}! Redirecting...`;
    setTimeout(() => {
      switchTab("register");
      msg.textContent = "";
      document.getElementById("login-mobile").value = "";
      document.getElementById("login-password").value = "";
    }, 1300);
  } else {
    msg.style.color = "red";
    msg.textContent = "Invalid mobile or password";
  }
  showUserInfo();
  updateStats();
};

document.getElementById("register-btn").onclick = () => {
  if (!loggedUser) {
    alert("Please login to submit a complaint");
    switchTab("login");
    return;
  }
  const complaint = document.getElementById("complaint-text").value.trim();
  const msg = document.getElementById("register-msg");
  if (complaint.length < 5) {
    msg.style.color = "red";
    msg.textContent = "Please enter detailed complaint";
    return;
  }
  const user = users.find(u => u.mob === loggedUser);
  const id = Date.now().toString().slice(-6);
  complaints.push({
    id,
    user: loggedUser,
    name: user.name,
    village: user.village,
    text: complaint,
    status: "Pending",
    response: ""
  });
  localStorage.setItem("complaints", JSON.stringify(complaints));
  msg.style.color = "green";
  msg.textContent = `Complaint registered! ID: ${id}`;
  document.getElementById("complaint-text").value = "";
  renderUserComplaints();
  updateStats();
};

document.getElementById("status-btn").onclick = () => {
  const id = document.getElementById("status-id").value.trim();
  const msg = document.getElementById("status-msg");
  const complaint = complaints.find(c => c.id === id);
  ["step1", "step2", "step3"].forEach(s => document.getElementById(s).classList.remove("active"));
  if (complaint) {
    if (complaint.status === "Pending") {
      document.getElementById("step1").classList.add("active");
      document.getElementById("step2").classList.add("active");
    }
    if (complaint.status === "Resolved") {
      document.getElementById("step1").classList.add("active");
      document.getElementById("step2").classList.add("active");
      document.getElementById("step3").classList.add("active");
    }
    msg.innerHTML = `
    <b>Status:</b> <span style="color:${complaint.status === 'Pending' ? '#4a90e2' : '#37c249'}">${complaint.status}</span><br>
    <b>Complaint:</b> ${complaint.text}<br>
    <b>Response:</b> ${complaint.response || "No response yet"}`;
    msg.style.color = "#333";
  } else {
    msg.style.color = "red";
    msg.textContent = "Complaint not found";
  }
};

function renderUserComplaints() {
  const container = document.getElementById("complaints-list");
  if (!loggedUser || !container) {
    container.innerHTML = "";
    return;
  }
  const filtered = complaints.filter(c => c.user === loggedUser);
  if (!filtered.length) {
    container.innerHTML = "<p>No complaints found.</p>";
    return;
  }
  container.innerHTML = `<table>
    <thead><tr><th>ID</th><th>Complaint</th><th>Status</th><th>Response</th></tr></thead>
    <tbody>${filtered.map(c => `
      <tr>
      <td>${c.id}</td><td>${c.text}</td>
      <td style="color:${c.status === "Pending" ? "#4a90e2" : "#37c249"}">${c.status}</td>
      <td>${c.response || "-"}</td>
      </tr>`).join("")}
    </tbody>
  </table>`;
  renderComplaintsChart();
}

function renderAdminComplaints() {
  const container = document.getElementById("admin-complaints");
  if (!container) return;
  if (!complaints.length) {
    container.innerHTML = "<p>No complaints yet.</p>";
    return;
  }
  container.innerHTML = `<table>
  <thead><tr><th>ID</th><th>Name</th><th>Village</th><th>Complaint</th><th>Status</th><th>Response</th></tr></thead>
  <tbody>${complaints.map(c => `
    <tr>
    <td>${c.id}</td><td>${c.name}</td><td>${c.village}</td><td>${c.text}</td>
    <td style="color:${c.status === 'Pending' ? '#4a90e2' : '#37c249'}">${c.status}</td>
    <td>${c.response || "-"}</td>
    </tr>`).join("")}
  </tbody>
  </table>`;
}

document.getElementById("admin-btn").onclick = () => {
  const id = document.getElementById("admin-id").value.trim();
  const response = document.getElementById("admin-response").value.trim();
  const msg = document.getElementById("admin-msg");
  const complaint = complaints.find(c => c.id === id);
  if (!complaint) {
    msg.style.color = "red";
    msg.textContent = "Complaint not found";
    return;
  }
  if (!response) {
    msg.style.color = "red";
    msg.textContent = "Please enter a response";
    return;
  }
  complaint.response = response;
  complaint.status = "Resolved";
  localStorage.setItem("complaints", JSON.stringify(complaints));
  msg.style.color = "green";
  msg.textContent = "Response recorded";
  document.getElementById("admin-id").value = "";
  document.getElementById("admin-response").value = "";
  renderAdminComplaints();
  renderUserComplaints();
  updateStats();
};

function updateStats() {
  document.getElementById("total-count").textContent = complaints.length;
  document.getElementById("pending-count").textContent = complaints.filter(c => c.status === "Pending").length;
  document.getElementById("resolved-count").textContent = complaints.filter(c => c.status === "Resolved").length;
}

function renderComplaintsChart() {
  const ctx = document.getElementById('complaintsChart').getContext('2d');
  const resolved = complaints.filter(c => c.status === "Resolved");
  let dateCount = {};
  resolved.forEach(c => {
    let date = new Date(parseInt(c.id));
    let ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    dateCount[ds] = (dateCount[ds] || 0) + 1;
  });
  let labels = Object.keys(dateCount).sort();
  if(labels.length > 10) labels = labels.slice(-10);
  let data = labels.map(x => dateCount[x] || 0);
  
  if(window.complaintsChart) window.complaintsChart.destroy(); 
  window.complaintsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['No Data'],
      datasets: [{ label: 'Resolved Complaints', data, fill: false, borderColor: '#4a90e2', backgroundColor: '#4a90e2', tension: 0.3, pointRadius: 4 }]
    },
    options: {
      responsive: true,
      plugins: { legend: {display: false} },
      scales: {
        y: {beginAtZero: true, grid: {color: '#e6e6e6'}},
        x: {grid: {color: '#e6e6e6'}}
      }
    }
  });
}

window.onload = () => {
  switchTab('home');
  showUserInfo();
  updateStats();
};
