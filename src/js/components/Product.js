import {select, classNames, templates} from '../settings.js';
import utils from'../utils.js';
import AmountWidget from'./AmountWidget.js';

class Product {
  constructor(id, data) {
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

    //   console.log('new Product:', thisProduct);
    //   console.log('thisProduct.element', thisProduct.element);
    // console.log('thisProduct.data', thisProduct.data);
  }

  renderInMenu() {
    const thisProduct = this;
    const generatedHTML = templates.menuProduct(thisProduct.data);
    // console.log('generatedHTML', generatedHTML);
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    const menuContainer = document.querySelector(select.containerOf.menu);
    // console.log('menuContainer', menuContainer);
    menuContainer.appendChild(thisProduct.element);
    // console.log('thisProduct.element', thisProduct.element);
  }

  getElements() {
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    //   console.log('thisProduct.form', thisProduct.form);
    //   console.log('thisProduct.formInputs', thisProduct.formInputs);
    //   console.log('thisProduct.cartButton', thisProduct.cartButton);
    //   console.log('thisProduct.priceElem', thisProduct.priceElem);
    // console.log('thisProduct.amountWidgetElem', thisProduct.amountWidgetElem);
  }

  initAccordion() {
    const thisProduct = this;
    // thisProduct.clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.accordionTrigger.addEventListener('click', function (event) {
      event.preventDefault();
      const activeProduct = document.querySelector('.product.active');
      if (activeProduct !== null && activeProduct !== thisProduct.element) {
        activeProduct.classList.remove('active');
      }
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }

  initOrderForm() {
    const thisProduct = this;
    // console.log('initOrderForm', thisProduct.initOrderForm);

    thisProduct.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
    });

    for (let input of thisProduct.formInputs) {
      input.addEventListener('change', function () {
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
      thisProduct.prepareCartProduct();
    });
  }

  initAmountWidget() {
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    // console.log('thisProduct.amountWidgetElem', thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function () {
      thisProduct.processOrder();
    });
  }

  processOrder() {
    const thisProduct = this;
    // console.log('processOrder', thisProduct.processOrder);

    const formData = utils.serializeFormToObject(thisProduct.form);
    // console.log('formData', formData);

    let price = thisProduct.data.price;

    for (let paramId in thisProduct.data.params) {
      // debugger;
      const param = thisProduct.data.params[paramId];
      // console.log('paramId, param', paramId, param);

      for (let optionId in param.options) {
        const option = param.options[optionId];
        // console.log('optionId, option', optionId, option);
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if (optionSelected) {
          if (!option.default) {
            price = price + option.price;
          }
        } else {
          if (option.default) {
            price = price - option.price;
          }
        }
        const optionImage = thisProduct.element.querySelector('.' + paramId + '-' + optionId);
        if (optionImage) {
          if (optionSelected) {
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          } else if (!optionSelected) {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }
    thisProduct.priceSingle = price;
    price *= thisProduct.amountWidget.value;
    thisProduct.priceElem.innerHTML = price;
  }

  prepareCartProduct() {
    const thisProduct = this;

    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: parseInt(thisProduct.priceElem.innerHTML),
      params: thisProduct.prepareCartProductParams(),
    };

    // console.log('productSummary', productSummary);

    return productSummary;
  }

  prepareCartProductParams() {
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form);
    // console.log('formData', formData);
    const params = {};

    for (let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];
      // console.log('param', param);

      params[paramId] = {
        label: param.label,
        options: {}
      };

      for (let optionId in param.options) {
        // console.log('optionIn', optionId);
        // console.log('param.options', param.options);
        const option = param.options[optionId];
        // console.log('option', option);
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

        if (optionSelected) {
          params[paramId].options[optionId] = option.label;
          // console.log('option.label', option.label);
        }
      }
    }
    // console.log('params', params);
    return params;
  }

  addToCart() {
    const thisProduct = this;

    // app.cart.add(thisProduct.prepareCartProduct());

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
  }

}
export default Product;
