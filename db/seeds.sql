INSERT INTO departments (name) 
VALUES
("Sales"),
("Technology"),
("Legal");

INSERT INTO roles (title, salary, dept_id) 
VALUES
("Sales Manager", "120000", 1),
("Sales Representative", "70000", 1),
("IT Manager", "130000", 2),
("Software Developer", "100000", 2),
("General Counsel", "140000", 3),
("Legal Assistant", "60000", 3);

INSERT INTO employees (first_name, last_name, role_id, manager_id) 
VALUES
    ('John', 'Doe', 1, null),
    ('Mike', 'Chan', 1, null),
    ('Ashley', 'Rodriguez', 2, null),
    ('Kevin','Tupik', 2, 2),
    ('Kunal', 'Singh', 3, null),
    ('Malia', 'Brown', 3, 4),
    ('Sarah', 'Lourd', 4, null),
    ('Tom', 'Allen', 4, 6);

   