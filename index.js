
const QUERY = `{
    userdata: user(where: {login: {_eq: "Sow"}}) {
      login
      id
    }
    progressByUser: progress(
      where: {_and: [{user: {login: {_eq: "Sow"}}}, {object: {type: {_eq: "project"}}}, {isDone: {_eq: true}}, {grade: {_neq: 0}}]}
      order_by: {updatedAt: asc}
    ) {
      id
      grade
      createdAt
      updatedAt
      object {
        id
        name
      }
    }
    projectTransaction: transaction(
      where: {_and: [{user: {login: {_eq: "Sow"}}}, {object: {type: {_eq: "project"}}}, {type: {_eq: "xp"}}]}
      order_by: {amount: desc}
    ) {
      amount
      createdAt
      object {
        id
        name
      }
    }
  }`;

const queryObject = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: QUERY,
  }),
};

fetch("https://learn.01founders.co/api/graphql-engine/v1/graphql", queryObject)
  .then((response) => response.json())
  .then(({ data, data: { userdata, progressByUser, projectTransaction } }) => {
    const profile = document.querySelector("#profile");
    const projects = document.querySelector("#completed-projects");
    const xpOverTime = document.querySelector("#xp");
    const xpByProject = document.querySelector("#projects-by-xp");
    console.log(userdata);
    profile.innerHTML = `<h2>Profile</h2><h3>Username: ${userdata[0].login}</h3>`;
    profile.innerHTML += `<h3>Last project: ${progressByUser.at(-1).object.name}</h3><h3>Total XP: 564 kB</h3><img src="./01Founders.png">`;
    projects.innerHTML = `<h2>Projects Completed</h2>`;
    console.log(progressByUser);
    projects.innerHTML += generateProjects(progressByUser);
    xpOverTime.innerHTML = `<h2>Xp over time</h2>`;
    const top5 = projectTransaction.filter((project, i) => i < 5);
    xpByProject.innerHTML = `<h2>Highest XP Projects</h2><h2 class="projectName"></h2><h2 class="projectXP"></h2>`;
    console.log(progressByUser, projectTransaction);
    generateBarChart(data);
    generatePieChart(top5);
  });
const generateProjects = (progressByUser) => {
  return progressByUser.reduce((acc, curr, i) => {
    const newAcc = `<h3>${i + 1} ${curr.object.name}</h3>`;
    return (acc += newAcc);
  }, "");
};

const generateBarChart = (data) => {
  const width = 600;
  const height = 500;
  const numOfColumns = 5;
  const barWidth = (width - 100) / numOfColumns; // adjust barWidth to take up entire width
  const barPadding = 0; // remove bar padding
  const maxValue = 2.5;

  // Extract the amount values and dates
  const amountValues = data.projectTransaction.map((item) => item.amount);
  const dates = data.projectTransaction.map((item) => item.createdAt);

  // Create the SVG element
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  // Define the X and Y axis
  const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxis.setAttribute("x1", "50");
  xAxis.setAttribute("y1", `${height - 50}`);
  xAxis.setAttribute("x2", `${width - 50}`);
  xAxis.setAttribute("y2", `${height - 50}`);
  svg.appendChild(xAxis);

  const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  yAxis.setAttribute("x1", "50");
  yAxis.setAttribute("y1", `${height - 50}`);
  yAxis.setAttribute("x2", "50");
  yAxis.setAttribute("y2", "50");
  svg.appendChild(yAxis);
  const dateRanges = [
    { start: new Date("2021-08-01"), end: new Date("2021-12-31") },
    { start: new Date("2022-01-01"), end: new Date("2022-03-31") },
    { start: new Date("2022-04-01"), end: new Date("2022-06-30") },
    { start: new Date("2022-07-01"), end: new Date("2022-11-30") },
    { start: new Date("2022-12-01"), end: new Date("2023-02-28") }
  ];

  // Create an array to store the accumulated values
  const accumulatedValues = Array(numOfColumns).fill(0);
  const accumulatedDates = Array(numOfColumns).fill("");

  for (let i = 0; i < data.projectTransaction.length; i++) {
    const date = new Date(data.projectTransaction[i].createdAt);

    // Check which column the date belongs to
    for (let j = 0; j < numOfColumns; j++) {
      if (date >= dateRanges[j].start && date <= dateRanges[j].end) {
        accumulatedValues[j] += data.projectTransaction[i].amount;
        accumulatedDates[j] = date;
        break;
      }
    }
  }
  for (let i = 0; i < numOfColumns; i++) {
    const scalingFactor = 0.00001;
    const barHeight = (accumulatedValues[i] / maxValue) * (height - 100) * scalingFactor;

    const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bar.setAttribute("x", `${50 + i * (barWidth + barPadding)}`);
    bar.setAttribute("y", `${height - 50 - barHeight}`);
    bar.setAttribute("width", barWidth);
    bar.setAttribute("height", barHeight);
    svg.appendChild(bar);

    // Add amount label for each bar
    const amountLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    amountLabel.setAttribute("x", `${50 + i * (barWidth + barPadding) + barWidth / 2}`);
    amountLabel.setAttribute("y", `${height - 50 - barHeight - 10}`);
    amountLabel.setAttribute("text-anchor", "middle");
    amountLabel.textContent = accumulatedValues[i];
    svg.appendChild(amountLabel);
    // Add XP label for each bar
    const dateLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    dateLabel.setAttribute("x", `${50 + i * (barWidth + barPadding) + barWidth / 2}`);
    dateLabel.setAttribute("y", `${height - 30}`);
    dateLabel.setAttribute("text-anchor", "middle");

    const startDate = dateRanges[i].start;
    const endDate = dateRanges[i].end;

    const startDateString = startDate.toLocaleString("default", { month: "short" }) + "-" + startDate.getFullYear();
    const endDateString = endDate.toLocaleString("default", { month: "short" }) + "-" + endDate.getFullYear();

    dateLabel.textContent = `${startDateString} to ${endDateString}`;
    svg.appendChild(dateLabel);
  }
  const xpOverTime = document.querySelector("#xp");
  xpOverTime.appendChild(svg);
};

const generatePieChart = (top5) => {
  const radius = 150;
  const total = top5.reduce((acc, val) => acc + val.amount, 0);
  const colors = ["#0050BF", "#00FF7B", "#FF003C","#FFFF3C","#FFA600"];
  let currentAngle = 0;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "500");
  svg.setAttribute("height", "500");
  console.log("h", top5);
  const project = document.createElement("h3");
  for (let i = 0; i < top5.length; i++) {
    const transaction = top5[i];
    const angle = (transaction.amount / total) * 360;
    const startX = 250;
    const startY = 250;
    const endX = startX + radius * Math.cos(((currentAngle + angle) * Math.PI) / 180);
    const endY = startY + radius * Math.sin(((currentAngle + angle) * Math.PI) / 180);
    const largeArcFlag = 0;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      `M ${startX} ${startY} L ${startX + radius * Math.cos((currentAngle * Math.PI) / 180)} ${
        startY + radius * Math.sin((currentAngle * Math.PI) / 180)
      } A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
    );

    path.setAttribute("fill", colors[i]);
    path.setAttribute("class", `${transaction.object.name}`);
    svg.appendChild(path);
    path.addEventListener("mouseover", () => {
      document.querySelector("#projects-by-xp > h2.projectName").innerText = transaction.object.name;
      document.querySelector("#projects-by-xp > h2.projectXP").innerText = `${transaction.amount} xp`;
    });
    path.addEventListener("mouseout", () => (project.innerText = ""));
    currentAngle += angle;
  }
  const xpByProject = document.querySelector("#projects-by-xp");
  xpByProject.appendChild(svg);
  project.classList.add("project");
  xpByProject.appendChild(project);
};