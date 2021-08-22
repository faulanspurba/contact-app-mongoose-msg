const express = require("express");
const app = express();
const port = 3000;

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

require("./utils/db");

const Contact = require("./models/contact");

const expressLayouts = require("express-ejs-layouts");
const { body, validationResult, check } = require("express-validator");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

// Konfigurasi flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: {
      maxAge: 6000,
      secret: "secret",
      resave: true,
      saveUninitialized: true,
    },
  })
);
app.use(flash());

// Menngunakan ejs
app.set("view engine", "ejs");
// Third-party middleware
app.use(expressLayouts);

// Built-in middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  const contacts = await Contact.find();
  res.render("index", {
    title: "Home",
    layout: "./layouts/main-layout",
    contacts,
  });
});

app.get("/about", (req, res) => {
  res.render("about", {
    title: "About",
    layout: "./layouts/main-layout",
  });
});

app.get("/contact", async (req, res) => {
  const contacts = await Contact.find();

  res.render("contact", {
    title: "Contact",
    layout: "./layouts/main-layout",
    contacts,
    msg: req.flash("msg"),
  });
});

// Add-data Contact Routes
app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Add Contact",
    layout: "./layouts/main-layout",
  });
});

// Add-data contact Process
app.post(
  "/contact",
  [
    body("name").custom(async (value) => {
      const mirror = await Contact.findOne({ name: value });
      if (mirror) {
        throw new Error("Nama contact sudah terdaftar");
      }
      return true;
    }),
    check("email", "Email tidak valid").isEmail(),
    check("mPhone", "Nomor HP tidak valid").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("add-contact", {
        title: "Contact",
        layout: "./layouts/main-layout",
        errors: errors.array(),
      });
    } else {
      Contact.insertMany(req.body, (error, result) => {
        // Kirimkan flash message
        req.flash("msg", "Kontak berhasil ditambahkan!");
        res.redirect("/contact");
      });
    }
  }
);

// Hapus data
app.delete("/contact", async (req, res) => {
  const contact = await Contact.findOne({ _id: req.body._id });
  if (!contact) {
    res.status(404);
    res.send(`<h1>404</h1>`);
  } else {
    Contact.deleteOne({ _id: contact._id }).then((result) => {
      // MESSAGE
      req.flash("msg", "Kontak berhasil dihapus!");
      res.redirect("/contact");
    });
  }
});

// Edit-contact Routes
app.get("/contact/edit/:_id", async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params._id });
  res.render("edit-contact", {
    title: "Edit Contact",
    layout: "./layouts/main-layout",
    contact,
  });
});

// Process Edit Data
app.put(
  "/contact",
  [
    body("name").custom(async (value, { req }) => {
      const mirror = await Contact.findOne({ name: value });
      if (value !== req.body.oldName && mirror) {
        throw new Error("Nama contact sudah terdaftar");
      }
      return true;
    }),
    check("email", "Email tidak valid").isEmail(),
    check("mPhone", "Nomor HP tidak valid").isMobilePhone("id-ID"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(400).json({ errors: errors.array() });
      res.render("edit-contact", {
        title: "Edit",
        layout: "./layouts/main-layout",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      Contact.updateOne(req.body, (error, result) => {
        // Kirimkan flash message
        req.flash("msg", "Kontak berhasil diubah!");
        res.redirect("/contact");
      });
    }
  }
);

// Halaman detail kontak
app.get("/contact/:_id", async (req, res) => {
  const contact = await Contact.findOne({ _id: req.params._id });

  res.render("details", {
    title: "Detail Contact",
    layout: "./layouts/main-layout",
    contact,
  });
});

app.use("/", (req, res) => {
  res.status(404);
  res.send(`Error : File not found`);
});

app.listen(port, () =>
  console.log(`App listening to http://localhost:${port}`)
);
