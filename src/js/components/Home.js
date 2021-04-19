import {
  select,
  templates
} from '../settings.js';
import {app} from '../app.js';

class Home {
  constructor(element) {
    const thisHome = this;

    thisHome.element = element;

    thisHome.render(element);
    thisHome.initHomeLinks();
  }

  render(element) {
    const thisHome = this;

    const generatedHTML = templates.homeWidget();

    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
    thisHome.dom.links = thisHome.dom.wrapper.querySelectorAll(select.nav.homeLinks);
  }

  initHomeLinks(){
    const thisHome = this;

    app.initLinks(thisHome.dom.links);
  }
}

export default Home;
