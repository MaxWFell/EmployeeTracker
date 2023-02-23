const inquirer = require("inquirer");
const mysql = require("mysql2/promise");
require("console.table");

const choices = {
  "View Departments": viewAllDepartments,
  "View Roles": viewAllRoles,
  "View Employees": viewAllEmployees,
  "Add Department": addNewDepartment,
  "Add Role": addNewRole,
  "Add Employee": addNewEmployee,
  "Update Employee Role": updateEmployeeRole,
  Exit: exitPrompt,
};

const dbPool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Sophiezoey12",
  database: "employee",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function getAllDeptDb() {
  const [departments] = await dbPool.execute(`SELECT * from departments;`);
  return departments;
}

async function getAllManagersDb() {
  const [managers] = await dbPool.execute(
    `SELECT * FROM employees WHERE manager_id IS NULL;`
  );
  return managers;
}

async function getAllRolesDb() {
  const [roles] = await dbPool.execute(`SELECT * FROM roles;`);
  return roles;
}

async function getManagersNames(managers) {
  const managerNames = managers.map(
    (manager) => `${manager.first_name} ${manager.last_name}`
  );
  return ["N/A"].concat(managerNames);
}

async function getManagerIdByName(managers, answer) {
  const [manager] = managers.filter(
    (manager) => `${manager.first_name} ${manager.last_name}` === answer.manager
  );
  return manager.employee_id;
}

function askPurpose() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "purpose",
        message: "What would you like to do?",
        choices: [...Object.keys(choices)],
      },
    ])
    .then((data) => {
      const choiceHandler = choices[data.purpose];
      choiceHandler();
    });
}

async function viewAllDepartments() {
  const departments = await getAllDeptDb();
  console.table(departments);
  askPurpose();
}

async function viewAllRoles() {
  const [roles] = await dbPool.execute(
    `SELECT roles.role_id, roles.title, dept.name AS department, roles.salary
     FROM roles 
     INNER JOIN departments AS dept
     ON roles.dept_id = dept.dept_id;`
  );
  console.table(roles);
  askPurpose();
}

async function viewAllEmployees() {
  const [employees] = await dbPool.execute(
    `SELECT emp.employee_id, emp.first_name, emp.last_name, rls.title, dept.name AS department, rls.salary, CONCAT(mng.first_name, ' ', mng.last_name) AS manager
     FROM roles AS rls
     INNER JOIN employees AS emp 
     ON rls.role_id = emp.role_id
     INNER JOIN departments AS dept
     ON rls.dept_id = dept.dept_id
     LEFT JOIN employees AS mng
     ON mng.employee_id = emp.manager_id 
     ORDER BY employee_id;`
  );
  console.table(employees);
  askPurpose();
}

function addNewDepartment() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "name",
        message: "What is the name of the department?",
      },
    ])
    .then(async (answer) => {
      await dbPool.query(
        `INSERT INTO departments (name) VALUES ('${answer.name}');`
      );
      console.log(`Added ${answer.name} to the database`);
      askPurpose();
    });
}

async function addNewRole() {
  const departments = await getAllDeptDb();

  inquirer
    .prompt([
      {
        type: "input",
        name: "title",
        message: "Insert roles name or title.",
      },
      {
        type: "input",
        name: "salary",
        message: "Insert roles salary.",
      },
      {
        type: "list",
        name: "department",
        message: "Insert roles, department.",
        choices: () => departments.map((department) => department.name),
      },
    ])
    .then(async (answer) => {
      const [department] = departments.filter(
        (department) => department.name === answer.department
      );
      const departmentId = department.dept_id;

      await dbPool.execute(
        `INSERT INTO roles (title, salary, dept_id)
          VALUES ('${answer.title}', '${answer.salary}', '${departmentId}');`
      );

      console.log(`Added ${answer.title} to the database`);
      askPurpose();
    });
}

async function addNewEmployee() {
  const managers = await getAllManagersDb();
  const roles = await getAllRolesDb();

  inquirer
    .prompt([
      {
        type: "input",
        name: "firstName",
        message: "What is the employee's first name?",
      },
      {
        type: "input",
        name: "lastName",
        message: "What is the employee's last name?",
      },
      {
        type: "list",
        name: "title",
        message: "What is the employee's role?",
        choices: roles.map((role) => role.title),
      },
      {
        type: "list",
        name: "manager",
        message: "What is the employee's manager?",
        choices: await getManagersNames(managers),
      },
    ])
    .then(async (answer) => {
      const [role] = roles.filter((role) => role.title === answer.title);
      const roleId = role.role_id;

      let managerId;
      if (answer.manager === "N/A") {
        managerId = null;
      } else {
        managerId = await getManagerIdByName(managers, answer);
      }

      await dbPool.execute(
        `INSERT INTO employees (first_name, last_name, role_id, manager_id)
         VALUES ('${answer.firstName}', '${answer.lastName}', ${roleId}, ${managerId});`
      );

      console.log(
        `Added ${answer.firstName} ${answer.lastName} to the database`
      );
      askPurpose();
    });
}

async function updateEmployeeRole() {
  const [employees] = await dbPool.query(
    `SELECT emp.employee_id, CONCAT(emp.first_name,' ', emp.last_name) AS name, roles.title, roles.role_id
     FROM employees AS emp
     LEFT JOIN roles 
     ON roles.role_id = emp.employee_id
     ORDER BY employee_id;`
  );
  const managers = await getAllManagersDb();
  const roles = await getAllRolesDb();

  inquirer
    .prompt([
      {
        type: "list",
        name: "name",
        message: "Which employee's role do you want to update?",
        choices: employees.map((employee) => employee.name),
      },
      {
        type: "list",
        name: "title",
        message: "What is the employee's new role?",
        choices: roles.map((role) => role.title),
      },
      {
        type: "list",
        name: "manager",
        message: "What is the employee's manager?",
        choices: await getManagersNames(managers),
      },
    ])
    .then(async (answer) => {
      const [firstName, lastName] = answer.name.split(" ");

      const [role] = roles.filter((role) => role.title === answer.title);
      const roleId = role.role_id;

      let managerId;
      if (answer.manager === "N/A") {
        managerId = null;
      } else {
        managerId = await getManagerIdByName(managers, answer);
      }

      await dbPool.query(
        `UPDATE employees
         SET role_id = ${roleId}, manager_id = ${managerId}
         WHERE first_name = '${firstName}' AND last_name = '${lastName}';`
      );

      console.log("Updated", `${answer.name}`, "'s role to the database");
      askPurpose();
    });
}

function exitPrompt() {
  console.log("Exiting...");
  process.exit();
}

function main() {
  askPurpose();
}

main();