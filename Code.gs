const fields = {
  paid: 0,
  name: 2,
  phone: 3,
  date: 4,
  time: 5,
  cake: 6,
  letter: 7,
  taste: [9, 10],
  size: 11,
  shape: [12, 13],
  color: 14,
  sentence: 16,
  decorations: 15,
  social_name: 17,
  order_from: 18,
  delivery_method: 19,
  delivery_address: 20,
  remarks: 21,
  printed: 22,
  index: 23,
};

function addChar(char, step) {
  return String.fromCharCode(char.charCodeAt(0) + step);
}

function lineIf(order, fields, { formatters = [], prefix = '' } = {}) {
  const line = (
    fields
      .map((field, index) => {
        const _formatters = [];
        if (formatters[index]) {
          _formatters.shift(formatters[index])
        }
        const value = order[field];

        if (value instanceof Date) {
          _formatters.shift((value.getMonth() + 1) + '/' + value.getDate());
        }

        return _formatters.reduce((val, formatter) => formatter(val), value);
      })
      .join(' ')
      .trim()
  );

if (!line) {
  return '';
}

return `${prefix}${line}\n`;
}

function stylePattern(body, pattern, { background, underline, bold } = {}) {
  var range = body.findText(pattern);

  while (range) {
    var text = range.getElement().asText();

    if (background) {
      text.setBackgroundColor(range.getStartOffset(), range.getEndOffsetInclusive(), background)
    }

    if (underline) {
      text.setUnderline(range.getStartOffset(), range.getEndOffsetInclusive(), underline)
    }

    if (bold) {
      text.setBold(range.getStartOffset(), range.getEndOffsetInclusive(), bold)
    }

    range = body.findText(pattern, range);
  }
}

function order2Str(order) {
  if (!order) return '';
  return (
    ((order['printed'] === true || order['printed'] === 'TRUE') ? '' : 'NEW\n') +
//    lineIf(order, ['paid'], { formatters: [val => (val === true || val === 'TRUE') ? 'Paid' : 'NOT Paid'] }) +
    lineIf(order, ['name', 'phone']/*, {prefix: '👨 '}*/) +
    lineIf(order, ['date', 'time']/*, {prefix: '🕐 '}*/) +
    lineIf(order, ['cake', 'size']/*, {prefix: '🎂 '}*/) +
    lineIf(order, ['taste', 'letter']/*, {prefix: '      '}*/) +
    lineIf(order, ['shape', 'color']/*, {prefix: '      '}*/) +
    lineIf(order, ['sentence'], { prefix: '✍️️ ' }) +
    lineIf(order, ['order_from', 'social_name']/*, {prefix: '📲 '}*/) +
    lineIf(order, ['delivery_method', 'delivery_address']/*, {prefix: '🚚 '}*/) +
    lineIf(order, ['decorations']) +
    lineIf(order, ['remarks'])
  )
}

function get(row, col) {
  return [].concat(fields[col]).reduce(function (acc, c) {
    var res = row[c] || acc
    if (col === 'TIME') {
      if (res instanceof Date) {
        res = res.getHours() + ':' + res.getMinutes()
      }
    }

    return res
  }, '')
}

function exportAllOrdersOfTmwTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 2)

  exportOrders({ date: date })
}

function exportUnprintedOrdersOfTmwTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 2)

  exportOrders({ unprintedOnly: true, date: date })
}

function exportAllOrdersOfTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 1)

  exportOrders({ date: date })
}

function exportUnprintedOrdersOfTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 1)

  exportOrders({ unprintedOnly: true, date: date })
}

function exportCustomOrders() {
  const [month, day] = Browser.inputBox('Orders Date', 'MM/DD', Browser.Buttons.OK_CANCEL).split('/').map(function (t) { return 0 + t });

  exportOrders({ date: new Date(new Date().getYear(), month - 1, day) })
}

function exportOrders(filter) {
  filter.paidOnly = true // Print only paid orders for now
  var sheet = SpreadsheetApp.getActiveSheet();

  const { date } = filter

  const [month, day, year] = [date.getMonth() + 1, date.getDate(), date.getFullYear()]
  const reportName = 'Orders for ' + month + '/' + day + (filter.paidOnly ? ' (Paid)' : ' (All)')

  var data = (
    sheet.getDataRange().getValues()
      .map(function (o, index) { o.id = index; return o })
      .filter(function (o) {
        var odate = get(o, 'date') || ''
        if (odate instanceof Date) {
          return odate.getMonth() + 1 == month && odate.getDate() == day
        }
        return (odate.replace('\'', '').trim() == month + '/' + day) || (odate.replace('\'', '').trim() == month + '/' + day + '/' + year)
      })
      .filter(function (o) { return (!filter.unprintedOnly) || !(get(o, 'printed') === 'TRUE' || get(o, 'printed') === true) })
      .filter(function (o) { return (!filter.paidOnly) || typeof get(o, 'paid') === 'string' ? 'TRUE' == get(o, 'paid') : get(o, 'paid') }) // paid
  );

  const orders = []

  data.forEach(function (row) {
    const order = {}
    Object.keys(fields).forEach(function (col) {
      var val = get(row, col)
      if (val.replace /*col === 'decorations'*/) {
        val = val
          .replace(/\(\+(\ *?)\$(\d|\.)*\)/g, '') // e.g. (+ $20)
          .replace(/\*\(推介\)(\ *)?/g, '')
          .replace(/\(FREE\)(\ *)?/g, '')
      }

      if (val) {
        order[col] = val
      }
    })
    orders.push(order)

    // Only change status to printed if order is paid
    if (order.paid) {
     sheet.getRange(addChar('A', fields.printed) + (row.id + 1)).setValue(true)
    }
  })

  var doc = DocumentApp.create(reportName)

  var body = doc.getBody()
  body.editAsText().setFontSize(21)
  body.setMarginBottom(0); body.setMarginTop(0);
  body.setMarginLeft(0); body.setMarginRight(0);
  var cells = []
  orders.forEach(function (o, i) {
    if (i % 4 != 0) return;

    Logger.log(order2Str(orders[i]))
    var table = body.appendTable([
      [order2Str(orders[i]), order2Str(orders[i + 1]) || ''],
      [order2Str(orders[i + 2]) || '', order2Str(orders[i + 3]) || '']
    ])
    body.appendPageBreak()
  })

  stylePattern(body, '#\d+', { bold: true })
  stylePattern(body, '(NOT )?Paid', { bold: true })
  stylePattern(body, '\d{8}', { bold: true }) // Phone number
  stylePattern(body, '寫名.*', { underline: true })
  stylePattern(body, '✍️.*', { underline: true })

  doc.saveAndClose()

  var docRef = DriveApp.getFileById(doc.getId())
  var dailyFolder = DriveApp.getFoldersByName('Daily').next()
  dailyFolder.addFile(docRef)
  DriveApp.removeFile(docRef)

  var pdfRef = DriveApp.createFile(doc.getAs('application/pdf'))
  dailyFolder.addFile(pdfRef)
  pdfRef.setName(reportName)
  DriveApp.removeFile(pdfRef)

  var html = HtmlService.createHtmlOutput('<a target=\"_blank\" href=\"' + pdfRef.getDownloadUrl().replace('&gd=true', '') + '\">Download</a>')
  SpreadsheetApp.getUi()
    .showModalDialog(html, 'Download');
}

function onOpen() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const tmw = new Date(); tmw.setDate(tmw.getDate() + 1)
  const tmwTmw = new Date(new Date().setDate(new Date().getDate() + 2));

  const [month, day] = [tmw.getMonth() + 1, tmw.getDate()] // tomorrow
  const [month1, day1] = [tmwTmw.getMonth() + 1, tmwTmw.getDate()] // tomorrow
  var marbleMenuEntries = [
    { name: "Export " + month + '/' + (day) + " orders (All)", functionName: "exportAllOrdersOfTmw" },
    { name: "Export " + month1 + '/' + (day1) + " orders (All)", functionName: "exportAllOrdersOfTmwTmw" },
    { name: "Export Custom orders", functionName: "exportCustomOrders" },
    { name: "Increment field", functionName: "autoIncrement" },
  ];
  sheet.addMenu("Marble", marbleMenuEntries);
};

function onEdit() {
  autoIncrement();
}

function autoIncrement() {
  var HEADER_ROW_COUNT = 1;

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var worksheet = spreadsheet.getActiveSheet();
  var rows = worksheet.getDataRange().getNumRows();
  var vals = worksheet.getSheetValues(1, 1, rows + 1, 2);

  worksheet.getRange(HEADER_ROW_COUNT, fields.index + 1).setValue('Index')

  for (var row = HEADER_ROW_COUNT; row < vals.length; row++) {
    try {
      var id = vals[row][fields.index];
      if (id === undefined) {
        // Here the columns & rows are 1-indexed
        worksheet.getRange(row + 1, fields.index + 1).setValue(row + 1);
      }
    } catch (e) {
      // Keep calm and carry on
    }
  }
}
