require("dotenv").config();

const cors = require("cors");
const express = require("express");

const {
  addVolunteer,
  findBestVolunteer,
  getAllVolunteers
} = require("./data/volunteers");
const { analyzeNeedWithGemini } = require("./services/geminiService");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    const volunteers = await getAllVolunteers();
    res.json({ status: "ok", volunteers: volunteers.length });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(500).json({ status: "error", error: error.message });
  }
});

app.post("/add-volunteer", async (req, res) => {
  const { name, skill, skills, location, phone, email } = req.body || {};

  if (!name || !(skill || (Array.isArray(skills) && skills.length)) || !location || !phone || !email) {
    return res.status(400).json({
      error: "name, skill/skills, location, phone, and email are required"
    });
  }

  try {
    const createdVolunteer = await addVolunteer({ name, skill, skills, location, phone, email });
    const allVolunteers = await getAllVolunteers();

    return res.status(201).json({
      message: "Volunteer added successfully",
      volunteer: createdVolunteer,
      totalVolunteers: allVolunteers.length
    });
  } catch (error) {
    console.error("Add volunteer failed:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/assign", async (req, res) => {
  const body = req.body || {};
  const description = body.description || body.text;
  const requiredSkill = body.required_skill || body.requiredSkill;
  const location = body.location;

  if (!description || !requiredSkill || !location) {
    return res.status(400).json({
      error: "description/text, required_skill/requiredSkill, and location are required"
    });
  }

  const matchResult = await findBestVolunteer(requiredSkill, location);
  const assignedVolunteer = matchResult.volunteer;
  const matchedVolunteers = Array.isArray(matchResult.volunteers) ? matchResult.volunteers : [];

  let analysis;

  try {
    analysis = await analyzeNeedWithGemini(description);
  } catch (error) {
    console.error("Gemini analysis failed:", error.message);

    return res.status(502).json({
      error: "Gemini analysis failed. Please try again.",
      details: error.message
    });
  }

  const volunteerResponse = assignedVolunteer
    ? {
        name: assignedVolunteer.name,
        skills: assignedVolunteer.skills || [assignedVolunteer.skill || "General"],
        location: assignedVolunteer.location,
        phone: assignedVolunteer.phone,
        email: assignedVolunteer.email
      }
    : null;

  const volunteersResponse = matchedVolunteers.map((volunteer) => ({
    name: volunteer.name,
    skills: volunteer.skills || [volunteer.skill || "General"],
    location: volunteer.location,
    phone: volunteer.phone,
    email: volunteer.email
  }));

  return res.json({
    urgency: analysis.urgency,
    category: analysis.category,
    volunteer: volunteerResponse,
    volunteers: volunteersResponse,
    summary: analysis.summary,
    matchMessage: matchResult.message,
    assignedVolunteer: assignedVolunteer
  });
});

app.listen(PORT, () => {
  console.log(`Volnix AI backend running on http://localhost:${PORT}`);
});
