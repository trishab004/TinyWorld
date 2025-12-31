
# TinyWorld 🌍

![TinyWorld Banner](https://via.placeholder.com/1000x300?text=TinyWorld+Chat+App) 
**TinyWorld** is a full-stack real-time chat application designed with a focus on **User Experience** and **Visuals**. It combines professional-grade security with a playful, "gaming-inspired" aesthetic featuring glassmorphism, neon glows, and floating 3D background elements.

## 🚀 Features

* **⚡ Real-Time Messaging:** Instant chat delivery using **Socket.io**.
* **🔒 Secure Authentication:** Passwords hashed with **bcrypt** and sessions managed via **JWT** (JSON Web Tokens).
* **🎨 Stunning UI:** Custom "Glassmorphism" design, dark/light mode toggle, and floating animated backgrounds.
* **🔔 Smart Notifications:** Unread message badges, real-time online status dots, and message sound effects.
* **📱 Responsive:** Fully responsive layout with a sleek sidebar and seamless chat interface.

## 🛠️ Tech Stack

* **Frontend:** React (Vite), CSS3 (Animations & Glassmorphism)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Atlas)
* **Real-Time:** Socket.io
* **Tools:** Axios, Dicebear API (for dynamic avatars)

## ⚙️ Installation & Setup

Want to run this locally? Follow these steps:

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/TinyWorld.git](https://github.com/YOUR_USERNAME/TinyWorld.git)
cd TinyWorld
```

### 2. Setup Backend

```Bash
cd backend
npm install
```

* Create a ```.env ``` file in the ```backend``` folder and add:
```bash
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
PORT=5000
```
* Start the server:

```Bash
npm run start
```

### 3. Setup Frontend
Open a new terminal, go back to the root, then:
```Bash
cd frontend
npm install
npm run dev
```

### 📸 Screenshots

| *<img width="1919" height="1027" alt="Screenshot 2025-12-31 222035" src="https://github.com/user-attachments/assets/d2fadbbe-c52e-4cbf-b9f4-62f25f0c31bc" />* |

| *<img width="1919" height="1023" alt="Screenshot 2025-12-31 222053" src="https://github.com/user-attachments/assets/7365e75b-929f-435c-981d-be615977f642" />* |

| *<img width="1919" height="1032" alt="Screenshot 2025-12-31 222245" src="https://github.com/user-attachments/assets/f1ca58e6-caa7-4cfc-96f3-603b1b635a7e" />* |


### Contributing
Contributions, https://www.google.com/search?q=issues, and feature requests are welcome! Feel free to check the issues page.📝 

### License
This project is open source and available under the MIT License.

Built with ❤️ by Trisha

