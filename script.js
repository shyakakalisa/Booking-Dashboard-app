const bookingForm = document.getElementById("bookingForm");
const bookingsList = document.getElementById("bookingsList");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const exportCsvBtn = document.getElementById("exportCsvBtn");

const totalBookings = document.getElementById("totalBookings");
const pendingBookings = document.getElementById("pendingBookings");
const confirmedBookings = document.getElementById("confirmedBookings");
const completedBookings = document.getElementById("completedBookings");

let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
let editBookingId = null;

function saveBookings() {
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

function updateStats() {
  totalBookings.textContent = bookings.length;
  pendingBookings.textContent = bookings.filter(b => b.status === "Pending").length;
  confirmedBookings.textContent = bookings.filter(b => b.status === "Confirmed").length;
  completedBookings.textContent = bookings.filter(b => b.status === "Completed").length;
}

function getStatusClass(status) {
  switch (status) {
    case "Pending":
      return "status-pending";
    case "Confirmed":
      return "status-confirmed";
    case "Completed":
      return "status-completed";
    case "Cancelled":
      return "status-cancelled";
    default:
      return "";
  }
}

function renderBookings() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedStatus = filterStatus.value;

  let filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.clientName.toLowerCase().includes(searchTerm) ||
      booking.service.toLowerCase().includes(searchTerm);

    const matchesStatus =
      selectedStatus === "All" || booking.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  if (filteredBookings.length === 0) {
    bookingsList.innerHTML = `<p class="empty-state">No bookings found.</p>`;
    updateStats();
    return;
  }

  filteredBookings.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA - dateB;
  });

  bookingsList.innerHTML = filteredBookings
    .map(
      booking => `
      <div class="booking-item">
        <div class="booking-top">
          <div>
            <h3>${booking.clientName}</h3>
            <p class="booking-meta">${booking.email}</p>
          </div>
          <span class="status-badge ${getStatusClass(booking.status)}">${booking.status}</span>
        </div>

        <p><strong>Service:</strong> ${booking.service}</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Time:</strong> ${booking.time}</p>
        <p><strong>Notes:</strong> ${booking.notes ? booking.notes : "None"}</p>

        <div class="booking-actions">
          <button class="action-btn edit-btn" onclick="editBooking('${booking.id}')">Edit</button>
          <button class="action-btn delete-btn" onclick="deleteBooking('${booking.id}')">Delete</button>
        </div>
      </div>
    `
    )
    .join("");

  updateStats();
}

function resetForm() {
  bookingForm.reset();
  editBookingId = null;
  bookingForm.querySelector("button[type='submit']").textContent = "Save Booking";
}

bookingForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const bookingData = {
    id: editBookingId || Date.now().toString(),
    clientName: document.getElementById("clientName").value.trim(),
    email: document.getElementById("email").value.trim(),
    service: document.getElementById("service").value,
    date: document.getElementById("bookingDate").value,
    time: document.getElementById("bookingTime").value,
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value.trim()
  };

  if (editBookingId) {
    bookings = bookings.map(booking =>
      booking.id === editBookingId ? bookingData : booking
    );
  } else {
    bookings.push(bookingData);
  }

  saveBookings();
  renderBookings();
  resetForm();
});

function editBooking(id) {
  const booking = bookings.find(b => b.id === id);
  if (!booking) return;

  document.getElementById("clientName").value = booking.clientName;
  document.getElementById("email").value = booking.email;
  document.getElementById("service").value = booking.service;
  document.getElementById("bookingDate").value = booking.date;
  document.getElementById("bookingTime").value = booking.time;
  document.getElementById("status").value = booking.status;
  document.getElementById("notes").value = booking.notes;

  editBookingId = id;
  bookingForm.querySelector("button[type='submit']").textContent = "Update Booking";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteBooking(id) {
  bookings = bookings.filter(booking => booking.id !== id);
  saveBookings();
  renderBookings();
}

function exportToCsv() {
  if (bookings.length === 0) {
    alert("No bookings to export.");
    return;
  }

  const headers = ["Client Name", "Email", "Service", "Date", "Time", "Status", "Notes"];
  const rows = bookings.map(booking => [
    booking.clientName,
    booking.email,
    booking.service,
    booking.date,
    booking.time,
    booking.status,
    booking.notes.replace(/,/g, ";")
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(value => `"${value}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute("download", "bookings.csv");
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

searchInput.addEventListener("input", renderBookings);
filterStatus.addEventListener("change", renderBookings);
exportCsvBtn.addEventListener("click", exportToCsv);

renderBookings();
