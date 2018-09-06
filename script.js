const maxDifficult = 3;
const dismissDevelopersInterval = 3;
function isInteger(num) {
  return (num - Math.floor(num)) === 0;
};
const getRandom = function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

class Developer {
  constructor() {
    this.daysWork = 0;
    this.project = null;
    this.projectsAmount = 0;
    this.freeDays = 0;
  }

  get free() {
    return this.daysWork < 1;
  }

  toDoWork(project, days) {
    project.setProcess('DISTRIBUTED');
    this.project = project;
    this.daysWork = days;
    this.freeDays = 0;
  }

  recalculateDaysWork() {
    this.daysWork -= 1;

    if (this.free) {
      if (!this.project) return;

      this.project.setProcess('TESTED');
      this.project = {};
      this.projectsAmount += 1;
    }
  }
}

class WebDeveloper extends Developer { }

class MobileDeveloper extends Developer { }

class QaDeveloper extends Developer {
  recalculateDaysWork() {
    this.daysWork -= 1;

    if (this.free) {
      if (!this.project) return;
      this.project.setProcess('FINISHED');
      this.project = null;
    }
  }
}

class Project {
  constructor(difficult) {
    this.process = {
      ACCEPTED: true,
      DISTRIBUTED: false,
      TESTED: false,
      FINISHED: false,
    };
    this.difficult = difficult;
  }

  get finished() {
    return this.process.FINISHED;
  }

  getDays(workersAmount) {
    const days = this.difficult / workersAmount;
    if (!isInteger(days)) throw new Error('Не целое число');

    return days;
  }

  setProcess(process) {
    const keys = Object.keys(this.process);

    keys.forEach((key) => {
      this.process[key] = false;
    });

    this.process[process] = true;
  }
}

class WebProject extends Project { }

class MobileProject extends Project { }

class Departament {
  constructor() {
    this.developers = [];
  }

  freeDevelopers() {
    return this.developers.filter(dev => dev.free);
  }

  busyDevelopers() {
    return this.developers.filter(dev => !dev.free);
  }

  acceptWorker(worker) {
    if (!this.canTakeWorker(worker)) return false;

    this.developers.push(worker);

    return true;
  }

  recalculateDay() {
    const busyDevelopers = this.busyDevelopers();
    busyDevelopers.forEach((dev) => {
      dev.recalculateDaysWork();
    });
    const freeDevelopers = this.freeDevelopers();
    freeDevelopers.forEach((dev) => {
      const developer = dev;
      developer.freeDays += 1;
    });
  }

  getDismissList() {
    return this.freeDevelopers().filter((developer) => {
      const isDismiss = developer.freeDays > dismissDevelopersInterval;
      return isDismiss;
    });
  }
}

class WebDepartament extends Departament {
  constructor() {
    super();
    this.developersType = WebDeveloper;
    this.projectsType = WebProject;
  }

  takeProject(project) {
    if (!this.canTakeProject(project)) return false;
    const freeDevelopers = this.freeDevelopers();

    freeDevelopers[0].toDoWork(project, project.getDays(1));

    return true;
  }

  canTakeWorker(worker) {
    return worker instanceof this.developersType;
  }

  canTakeProject(project) {
    return this.freeDevelopers().length && project instanceof this.projectsType && !project.process.TESTED;
  }
}

class MobileDepartament extends Departament {
  constructor() {
    super();
    this.developersType = MobileDeveloper;
    this.projectsType = MobileProject;
  }

  takeProject(project) {
    const freeDevelopers = this.freeDevelopers();
    const { difficult } = project;
    let workersAmount = 1;

    if (!this.canTakeProject(project)) return false;

    if (freeDevelopers.length >= difficult) {
      workersAmount = difficult;
    }

    let developersAmount = workersAmount;

    while (developersAmount > 0) {
      developersAmount -= 1;
      const dev = freeDevelopers.shift();
      dev.toDoWork(project, project.getDays(workersAmount));
    }

    return true;
  }

  canTakeWorker(worker) {
    return worker instanceof this.developersType;
  }

  canTakeProject(project) {
    return this.freeDevelopers().length && project instanceof this.projectsType && !project.process.TESTED;
  }
}

class QaDepartament extends Departament {
  constructor() {
    super();
    this.developersType = QaDeveloper;
  }

  takeProject(project) {
    const freeDevelopers = this.freeDevelopers();
    const developersAmount = 1; //QaDeveloper working on project alone

    if (!this.canTakeProject(project)) return false;

    freeDevelopers[0].toDoWork(project, developersAmount);

    return true;
  }

  canTakeWorker(worker) {
    return worker instanceof this.developersType;
  }

  canTakeProject(project) {
    return project.process.TESTED && this.freeDevelopers().length;
  }
}

const projectClasses = [WebProject, MobileProject];

Project.generateRandomProject = function generateRandomProject() {
  const projectClassesAmount = projectClasses.length;
  const difficult = getRandom(1, maxDifficult + 1);
  const ProjectClass = projectClasses[getRandom(0, projectClassesAmount)];
  return new ProjectClass(difficult);
};

class LogItem {
  constructor(config) {
    this.finishedProjects = config.finishedProjects || [];
    this.acceptedProjects = config.acceptedProjects || [];
    this.dismissedDeveloper = config.dismissedDeveloper;
    this.acceptedDevelopers = config.acceptedDevelopers || [];
  }

  get dismissedType() {
    if (this.dismissedDeveloper) {
      if (this.dismissedDeveloper instanceof WebDeveloper) {
        return 'Web developer';
      }
      if (this.dismissedDeveloper instanceof MobileDeveloper) {
        return 'Mobile developer';
      }
      if (this.dismissedDeveloper instanceof QaDeveloper) {
        return 'Qa developer';
      }
    }
    return 'Не стал увольнять, у него жена, дети...';
  }

  getAcceptedDevelopersForType(devClass) {
    return this.acceptedDevelopers.filter(dev => dev instanceof devClass);
  }

  toString() {
    return `День ${this.day}, принято проектов ${this.acceptedProjects.length}, завершено проектов ${this.finishedProjects.length}, 
    принято рабочих ${this.acceptedDevelopers.length}, из них: webDevelopers - ${this.getAcceptedDevelopersForType(WebDeveloper).length}, mobileDevelopers - ${this.getAcceptedDevelopersForType(MobileDeveloper).length}, qaDevelopers - ${this.getAcceptedDevelopersForType(QaDeveloper).length}
    уволен рабочий: ${this.dismissedType}`;
  }
}

class Log {
  constructor() {
    this.logs = [];
    this.finishedProjects = [];
    this.acceptedProjects = [];
    this.dismissedDevelopers = [];
    this.acceptedDevelopers = [];
  }

  addLog(log) {
    this.logs.push(log);
  }

  getFullLog() {
    const { logs } = this;

    logs.forEach((log) => {
      const { finishedProjects = [], acceptedProjects = [], acceptedDevelopers = [], dismissedDeveloper } = log;

      this.getAllProperties(finishedProjects, this.finishedProjects);
      this.getAllProperties(acceptedProjects, this.acceptedProjects);
      this.getAllProperties(acceptedDevelopers, this.acceptedDevelopers);

      if (dismissedDeveloper) {
        this.dismissedDevelopers.push(dismissedDeveloper);
      }
    });
  }

  getAllProperties(array, log) {
    array.forEach((obj) => {
      log.push(obj);
    });
    return this;
  }

  toString() {
    return `-------------------------------------------
    Всего: дней: ${this.logs.length}, принято проектов ${this.acceptedProjects.length}, завершено проектов ${this.finishedProjects.length},
    уволено рабочих ${this.dismissedDevelopers.length}, принято рабочих ${this.acceptedDevelopers.length} `;
  }
}

class Director {
  constructor() {
    this.projects = [];
    this.needAccept = [];
    this.webDepartament = new WebDepartament();
    this.mobileDepartament = new MobileDepartament();
    this.qaDepartament = new QaDepartament();
  }

  doWork() {
    const logConfig = {
      finishedProjects: null,
      acceptedProjects: null,
      dismissedDeveloper: null,
      acceptedDevelopers: null,
    };

    logConfig.acceptedDevelopers = this.hireDevelopers();
    logConfig.acceptedProjects = this.getProjects();

    this.distributeProjects();

    logConfig.dismissedDeveloper = this.dismissFreeDeveloper();

    this.recalculateDevelopersDay();

    logConfig.finishedProjects = this.deleteFinishedProjects();

    return new LogItem(logConfig);
  }

  getProjects() {
    let projectsAmount = getRandom(0, 5);
    const acceptedProjects = [];

    while (projectsAmount > 0) {
      projectsAmount -= 1;
      const project = Project.generateRandomProject();

      this.projects.push(project);
      acceptedProjects.push(project);
    }

    return acceptedProjects;
  }

  hireDevelopers() {
    const newDevelopers = [];

    if (this.needAccept.length) {
      this.needAccept.forEach((DeveloperClass) => {
        const newDeveloper = new DeveloperClass();

        const isAccept = this.departamentsArray.some(dep => dep.acceptWorker(newDeveloper));

        if (!isAccept) throw new Error('принят работник неизвестного типа');

        newDevelopers.push(newDeveloper);
      });
      this.needAccept = [];
    }

    return newDevelopers;
  }

  distributeProjects() {
    if (!this.projects.length) return;

    const projects = this.projects.filter(p => p.process.ACCEPTED || p.process.TESTED);

    projects.forEach((project) => {
      const isAccept = this.departamentsArray.some(dep => dep.takeProject(project));

      if (!isAccept) {
        let developerClass = null;
        if (project instanceof WebProject && !project.process.TESTED) {
          developerClass = WebDeveloper;
        } else if (project instanceof MobileProject && !project.process.TESTED) {
          developerClass = MobileDeveloper;
        } else if (project.process.TESTED) {
          developerClass = QaDeveloper;
        }

        if (developerClass) {
          this.needAccept.push(developerClass);
        } else {
          throw new Error('Неизвестный тип проекта');
        }
      }
    });
  }

  dismissFreeDeveloper() {
    const dismissed = this.searchDismissedDeveloper();

    if (!dismissed) return false;

    const departament = this.identifyDepartament(dismissed);

    if (!departament) return false;

    const index = departament.developers.indexOf(dismissed);

    if (index !== -1) {
      departament.developers.splice(index, 1);

      return dismissed;
    }

    return false;
  }

  searchDismissedDeveloper() {
    const dismissWebDevelopers = this.webDepartament.getDismissList();
    const dismissMobileDevelopers = this.mobileDepartament.getDismissList();
    const dismissQaDevelopers = this.qaDepartament.getDismissList();

    const dismiss = [].concat(dismissWebDevelopers, dismissMobileDevelopers, dismissQaDevelopers);

    if (dismiss.length === 0) return false;

    dismiss.sort((dev1, dev2) => dev1.projectsAmount - dev2.projectsAmount);

    return dismiss[0];
  }

  identifyDepartament(obj) {
    let departament = null;

    if (obj instanceof WebDeveloper || obj instanceof WebProject) {
      departament = this.webDepartament;
    }

    if (obj instanceof MobileDeveloper || obj instanceof MobileProject) {
      departament = this.mobileDepartament;
    }

    if (obj instanceof QaDeveloper) {
      departament = this.qaDepartament;
    }

    return departament || false;
  }

  deleteFinishedProjects() {
    const finishedProjects = this.projects.filter(p => p.finished);

    if (!finishedProjects.length) return false;

    finishedProjects.forEach((project) => {
      const index = this.projects.indexOf(project);

      if (index !== -1) {
        this.projects.splice(index, 1);
      }
    });

    return finishedProjects;
  }

  recalculateDevelopersDay() {
    this.webDepartament.recalculateDay();
    this.mobileDepartament.recalculateDay();
    this.qaDepartament.recalculateDay();
  }

  get departamentsArray() {
    return [this.webDepartament, this.mobileDepartament, this.qaDepartament]
  }
}

class WebCompany {
  constructor() {
    this.director = new Director();
    this.logs = new Log();
    this.lastLog = null;
    this.day = 1;
  }

  changeDay() {
    const log = this.director.doWork();
    log.day = this.day;
    this.day += 1;
    this.lastLog = log;
    this.logs.addLog(log);
  }

  getLog() {
    return String(this.lastLog);
  }

  getFullLog() {
    this.logs.getFullLog();
    return String(this.logs);
  }
}

let daysAmount = 100;
const webCompany = new WebCompany();

while (daysAmount > 0) {
  webCompany.changeDay();
  console.log(webCompany.getLog());

  daysAmount -= 1;
}

console.log(webCompany.getFullLog());
