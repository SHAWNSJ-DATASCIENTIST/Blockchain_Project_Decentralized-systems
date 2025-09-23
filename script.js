let users = JSON.parse(localStorage.getItem("users") || "[]");
let complaints = JSON.parse(localStorage.getItem("complaints") || "[]");
let loggedUser = localStorage.getItem("loggedUser") || null;

// Tab switching
function showTab(tab) {
  document.querySelectorAll('.tab').forEach(e => e.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  if (tab === "dashboard") renderUserComplaints();
  if (tab === "admin") renderAdminComplaints();
  if (tab === "about") renderAboutChart();
  updateStats();
  showUserInfo();
}

// Navigation clicks
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = () => showTab(btn.getAttribute('data-tab'));
});

// Home buttons
document.getElementById('home-signup-btn').onclick = () => showTab('signup');
document.getElementById('home-login-btn').onclick = () => showTab('login');

// Logout
function logout() {
  loggedUser = null;
  localStorage.removeItem("loggedUser");
  showUserInfo();
  showTab("home");
}
document.getElementById("logout-btn").onclick = logout;

// User info
function showUserInfo() {
  const info = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout-btn");
  if (!loggedUser) {
    info.textContent = "";
    logoutBtn.style.display = "none";
  } else {
    const user = users.find(u => u.mob === loggedUser);
    info.textContent = user ? `Logged in as: ${user.name} (${user.village})` : "Logged in";
    logoutBtn.style.display = "block";
  }
}

// Sign Up
document.getElementById('signup-btn').onclick = function () {
  const name = document.getElementById("signup-name").value.trim();
  const village = document.getElementById("signup-village").value.trim();
  const age = Number(document.getElementById("signup-age").value);
  const mob = document.getElementById("signup-mobile").value.trim();
  const pwd = document.getElementById("signup-password").value;
  const msg = document.getElementById("signup-msg");

  if (!name || !village || !age || !mob || !pwd) {
    msg.style.color = "red";
    msg.textContent = "Please fill all fields!";
    return;
  }
  if (users.some(u => u.mob === mob)) {
    msg.style.color = "orange";
    msg.textContent = "User exists!";
    return;
  }
  users.push({ name, village, age, mob, pwd });
  localStorage.setItem("users", JSON.stringify(users));
  msg.style.color = "green";
  msg.textContent = "Account created! Please log in.";
  ["signup-name","signup-village","signup-age","signup-mobile","signup-password"].forEach(id=>document.getElementById(id).value="");
}

// Login
document.getElementById('login-btn').onclick = function () {
  const mob = document.getElementById("login-mobile").value.trim();
  const pwd = document.getElementById("login-password").value;
  const msg = document.getElementById("login-msg");
  const user = users.find(u => u.mob === mob && u.pwd === pwd);
  if (user) {
    loggedUser = mob;
    localStorage.setItem("loggedUser", loggedUser);
    msg.style.color = "green";
    msg.textContent = `Logged in as ${user.name}. Redirecting...`;
    setTimeout(() => {
      showTab("register");
      msg.textContent = "";
      document.getElementById("login-mobile").value = "";
      document.getElementById("login-password").value = "";
    }, 1000);
  } else {
    msg.style.color = "red";
    msg.textContent = "Invalid mobile or password!";
  }
  showUserInfo();
  updateStats();
}

// Register complaint
document.getElementById('register-btn').onclick = function () {
  if (!loggedUser) { alert("Login first."); showTab("login"); return; }
  const complaint = document.getElementById("complaint-text").value.trim();
  const msg = document.getElementById("register-msg");
  if (complaint.length < 5) { msg.style.color="red"; msg.textContent="Please enter a detailed complaint."; return; }
  const user = users.find(u => u.mob===loggedUser);
  const id = Date.now().toString().slice(-6);
  complaints.push({id,user:loggedUser,name:user.name,village:user.village,text:complaint,status:"Pending",response:""});
  localStorage.setItem("complaints", JSON.stringify(complaints));
  msg.style.color="green";
  msg.textContent=`Complaint registered! ID: ${id}`;
  document.getElementById("complaint-text").value="";
  renderUserComplaints();
  updateStats();
}

// User complaints
function renderUserComplaints() {
  const container = document.getElementById("complaints-list");
  if (!container) return;
  const mine = loggedUser ? complaints.filter(c=>c.user===loggedUser) : [];
  if (!mine.length) { container.innerHTML="<p>No complaints yet.</p>"; return; }
  container.innerHTML=`<table><thead><tr><th>ID</th><th>Complaint</th><th>Status</th><th>Response</th></tr></thead><tbody>
  ${mine.map(c=>`<tr><td>${c.id}</td><td>${c.text}</td><td style="color:${c.status==="Pending"?"#4a90e2":"#37c249"}">${c.status}</td><td>${c.response||"-"}</td></tr>`).join('')}
  </tbody></table>`;
}

// Check status
document.getElementById('status-btn').onclick = function () {
  const id=document.getElementById("status-id").value.trim();
  const msg=document.getElementById("status-msg");
  const c=complaints.find(c=>c.id===id);
  ["step1","step2","step3"].forEach(s=>document.getElementById(s).classList.remove("active"));
  if(c){
    if(c.status==="Pending"){document.getElementById("step1").classList.add("active");document.getElementById("step2").classList.add("active");}
    if(c.status==="Resolved"){["step1","step2","step3"].forEach(s=>document.getElementById(s).classList.add("active"));}
    msg.innerHTML=`Status: <strong style="color:${c.status==="Pending"?"#4a90e2":"#37c249"}">${c.status}</strong><br>Complaint: ${c.text}<br>Response: ${c.response||"No response yet"}`;
    msg.style.color="#333";
  } else { msg.style.color="red"; msg.textContent="Complaint not found"; }
}

// Admin
function renderAdminComplaints() {
  const container=document.getElementById("admin-complaints");
  if(!container) return;
  if(!complaints.length){container.innerHTML="<p>No complaints yet.</p>"; return;}
  container.innerHTML=`<table><thead><tr><th>ID</th><th>Name</th><th>Village</th><th>Complaint</th><th>Status</th><th>Response</th></tr></thead><tbody>
  ${complaints.map(c=>`<tr><td>${c.id}</td><td>${c.name}</td><td>${c.village}</td><td>${c.text}</td><td style="color:${c.status==="Pending"?"#4a90e2":"#37c249"}">${c.status}</td><td>${c.response||"-"}</td></tr>`).join('')}
  </tbody></table>`;
}

document.getElementById('admin-btn').onclick=function(){
  const id=document.getElementById("admin-id").value.trim();
  const response=document.getElementById("admin-response").value.trim();
  const msg=document.getElementById("admin-msg");
  const c=complaints.find(cmp=>cmp.id===id);
  if(!c){msg.style.color="red";msg.textContent="Complaint not found"; return;}
  if(!response){msg.style.color="red";msg.textContent="Please enter a response"; return;}
  c.response=response;c.status="Resolved";
  localStorage.setItem("complaints",JSON.stringify(complaints));
  msg.style.color="green"; msg.textContent="Response recorded";
  document.getElementById("admin-id").value=""; document.getElementById("admin-response").value="";
  renderAdminComplaints(); renderUserComplaints(); updateStats();
}

// Officer login
document.getElementById('officer-btn').onclick=function(){
  const id=document.getElementById("officer-id").value.trim();
  const pwd=document.getElementById("officer-password").value;
  const msg=document.getElementById("officer-msg");
  if(id==="officer1" && pwd==="password123"){
    msg.style.color="green"; msg.textContent=`Officer ${id} logged in successfully!`;
    document.getElementById("officer-id").value=""; document.getElementById("officer-password").value="";
  } else { msg.style.color="red"; msg.textContent="Invalid Officer ID or password!"; }
}

// Update stats
function updateStats(){
  document.getElementById("total-count").textContent=complaints.length;
  document.getElementById("pending-count").textContent=complaints.filter(c=>c.status==="Pending").length;
  document.getElementById("resolved-count").textContent=complaints.filter(c=>c.status==="Resolved").length;
}

// --- ABOUT TAB SMALL LINE PLOT ---
function renderAboutChart() {
  const ctx = document.getElementById('complaintChart').getContext('2d');

  const lastComplaints = complaints.slice(-7);
  const labels = lastComplaints.map((c, i) => `#${c.id}`);
  const resolvedData = lastComplaints.map(c => c.status === "Resolved" ? 1 : 0);
  const pendingData = lastComplaints.map(c => c.status === "Pending" ? 1 : 0);

  if (window.complaintChart) window.complaintChart.destroy();

  window.complaintChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Resolved',
          data: resolvedData,
          borderColor: '#37c249',
          backgroundColor: 'rgba(55, 194, 73, 0.2)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Pending',
          data: pendingData,
          borderColor: '#4a90e2',
          backgroundColor: 'rgba(74,144,226,0.2)',
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: false,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: {
        x: { display: true, ticks: { font: { size: 8 } } },
        y: { display: true, beginAtZero: true, ticks: { font: { size: 8 }, stepSize: 1, precision:0 } }
      }
    }
  });
}

// Initialize
showTab("home");
