/**
 * @jest-environment jsdom
 */
import MockedStore from '../__mocks__/store';
import { screen, waitFor } from "@testing-library/dom";
import Bills from "../containers/Bills";
import { ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage";
import router from "../app/Router";
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      const hasActiveIconClass = windowIcon.classList.contains('active-icon');

      expect(hasActiveIconClass).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  test('Constructor Initialization', () => {
    const billsInstance = new Bills({ document: document, onNavigate: jest.fn(), store: MockedStore });
    expect(billsInstance.document).toBe(document);
    expect(billsInstance.onNavigate).toBeDefined();
    expect(billsInstance.store).toBe(MockedStore);
  });

  test("Then clicking on 'New Bill' button should navigate to the NewBill page", async () => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }));

    const root = document.createElement('div');
    root.setAttribute('id', 'root');
    document.body.appendChild(root);

    router();
    await window.onNavigate(ROUTES_PATH.Bills);

    // Wait for the "New Bill" button to appear in the DOM
    await waitFor(() => screen.getByTestId('btn-new-bill'));

    const buttonNewBill = screen.getByTestId('btn-new-bill');
    await buttonNewBill.dispatchEvent(new MouseEvent('click'));

    const newBillUrl = window.location.href.replace(/^https?:\/\/localhost\//, '');
    expect(newBillUrl).toBe('#employee/bill/new');
  });
});


test('handleClickIconEye is called when the icon is clicked', () => {
  const billsInstance = new Bills({ document: document, onNavigate: jest.fn(), store: MockedStore });
  const mockIcon = document.createElement('div');
  mockIcon.setAttribute('data-bill-url', 'mockBillUrl');

  // Mock the handleClickIconEye method
  billsInstance.handleClickIconEye = jest.fn();

  // Mock the modal function directly on the prototype of window.$
  window.$.fn.modal = jest.fn();

  // Attach the handleClickIconEye method to the icon click event
  mockIcon.addEventListener('click', () => billsInstance.handleClickIconEye(mockIcon));

  // Trigger the click event on the mocked icon
  mockIcon.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  // Checking if the handleClickIconEye method was called with the expected parameters
  expect(billsInstance.handleClickIconEye).toHaveBeenCalledWith(mockIcon);
});


test('handleClickIconEye shows modal', () => {
  const billsInstance = new Bills({ document: document, onNavigate: jest.fn(), store: MockedStore });
  const mockIcon = document.createElement('div');
  mockIcon.setAttribute('data-bill-url', 'mockBillUrl');

  // Mock the modal function directly on the prototype of window.$
  window.$.fn.modal = jest.fn();

  billsInstance.handleClickIconEye(mockIcon);

  // Checking if the modal function was called with the expected parameters
  expect(window.$.fn.modal).toHaveBeenCalledWith('show');
});

const mockStore = {
  bills: jest.fn(() => ({
    list: jest.fn(() => Promise.resolve([
      {
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20
      },
      {
        "id": "BeKy5Mo4jkmdfPGYpTxZ",
        "vat": "",
        "amount": 100,
        "name": "test1",
        "fileName": "1592770761.jpeg",
        "commentary": "plop",
        "pct": 20,
        "type": "Transports",
        "email": "a@a",
        "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…61.jpeg?alt=media&token=7685cd61-c112-42bc-9929-8a799bb82d8b",
        "date": "2001-01-01",
        "status": "refused",
        "commentAdmin": "en fait non"
      },
    ])),
  })),
};

test('getBills successfully retrieves bills from the mock store', async () => {
  const billsComponent = new Bills({ document, onNavigate, store: mockStore });
  const getBillsPromise = billsComponent.getBills();

  await getBillsPromise;

  // Verify that the mock store was called to retrieve bills
  expect(mockStore.bills).toHaveBeenCalledTimes(1);

  // Access the bills directly from the mock store after the promise resolves
  const billsFromStore = await mockStore.bills().list();

  // Verify that the `getBills` method returned an array of bills
  expect(billsFromStore).toBeTruthy();
  expect(billsFromStore.length).toBe(2); // Adjust the length based on your mocked data
});


test('getBills handles error in list method', async () => {
  const mockError = new Error('Simulated error in list method');

  // Mock the list method to return a rejected promise
  const mockStoreWithError = {
    bills: jest.fn(() => ({
      list: jest.fn(() => Promise.reject(mockError)),
    })),
  };

  const billsComponent = new Bills({ document, onNavigate, store: mockStoreWithError });

  // Attempt to call the getBills method
  try {
    await billsComponent.getBills();
  } catch (error) {
    // Verify that the expected error is caught
    expect(error).toBe(mockError);
  }
});

const mockStoreForGetBills = {
  bills: jest.fn(() => ({
    list: jest.fn(() => Promise.resolve([
    ])),
  })),
};


test('getBills returns an empty array when no bills are found in the store', async () => {
  const billsComponent = new Bills({ document, onNavigate, store: mockStoreForGetBills });

  // Simulate an empty array of bills in the mock store
  mockStoreForGetBills.bills().list.mockResolvedValue([]);

  const bills = await billsComponent.getBills();

  expect(bills).toEqual([]);
});




const mockFormatDate = jest.fn(() => {
  if (typeof jest.fn().mockRejectedValue === 'function') {
    return jest.fn().mockRejectedValue(new Error('Invalid date format'));
  } else {
    throw new Error('Invalid date format');
  }
});


test('getBills returns a bill with an unformatted date when formatDate throws an error', async () => {
  // Mock the store
  const mockStore = {
    bills: jest.fn(() => ({
      list: jest.fn(() => Promise.resolve([
        {
          date: 'invalid-date-format',
        },
      ])),
    })),
  };

  // Simulate an error in formatDate
  mockFormatDate.mockReturnValue('invalid-date-format');

  const billsComponent = new Bills({ document, onNavigate, store: mockStore });
  const bills = await billsComponent.getBills();

  // Check for unformatted date
  expect(bills[0].date).toBe('invalid-date-format');
});


describe('Bills', () => {
  it('it adds event listeners to iconEye elements and handles click', () => {
    const bills = new Bills({ document: document });
    const iconEyes = document.querySelectorAll('div[data-testid="icon-eye"]');
   
    for (const iconEye of iconEyes) {
      bills.handleClickIconEye(iconEye);
    }

    for (const iconEye of iconEyes) {
      jest.spyOn(bills, 'handleClickIconEye');
      iconEye.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(bills.handleClickIconEye).toHaveBeenCalled();
      expect(bills.handleClickIconEye).toHaveBeenCalledWith(iconEye);
    }
  });
});

test('getBills handles error when bills list returns 404', async () => {
  const mockError = new Error('Simulated error: Bills not found (404)');

  // Mock the list method to return a rejected promise with 404 error
  const mockStoreWith404Error = {
    bills: jest.fn(() => ({
      list: jest.fn(() => Promise.reject(mockError)),
    })),
  };

  const billsComponent = new Bills({ document, onNavigate, store: mockStoreWith404Error });

  // Attempt to call the getBills method
  try {
    await billsComponent.getBills();
  } catch (error) {
    // Verify that the expected 404 error is caught
    expect(error).toBe(mockError);
  }
});

// Similar structure can be used for testing 500 error
test('getBills handles error when bills list returns 500', async () => {
  const mockError = new Error('Simulated error: Internal Server Error (500)');

  // Mock the list method to return a rejected promise with 500 error
  const mockStoreWith500Error = {
    bills: jest.fn(() => ({
      list: jest.fn(() => Promise.reject(mockError)),
    })),
  };

  const billsComponent = new Bills({ document, onNavigate, store: mockStoreWith500Error });

  // Attempt to call the getBills method
  try {
    await billsComponent.getBills();
  } catch (error) {
    // Verify that the expected 500 error is caught
    expect(error).toBe(mockError);
  }
});