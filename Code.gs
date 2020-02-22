var fields = {
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
  printed: 22
};

function lineIf(o, fields, opt) {
  const line = (
    fields
    .map(function(f, i) {
      if (opt && opt.overrides && opt.overrides[i]) {
        return opt.overrides[i](o[f])
      }
      if (o[f] instanceof Date) {
        return (o[f].getMonth() + 1) + '/' + o[f].getDate();
      }
      return o[f]
    })
    .join(' ')
  )
  return (line.trim().length > 0) ? ((opt && opt.prefix) || '') + line.trim() + '\n' : ''
}

function stylePattern(body, pattern, opt) {
  var range = body.findText(pattern);

  while (range !== null) {
    var text = range.getElement().asText();
    
    if (opt.background) {
      text.setBackgroundColor(range.getStartOffset(), range.getEndOffsetInclusive(), opt.background)
    }
    
    if (opt.underline) {
      text.setUnderline(range.getStartOffset(), range.getEndOffsetInclusive(), opt.underline)
    }
    
    if (opt.bold) {
      text.setBold(range.getStartOffset(), range.getEndOffsetInclusive(), opt.bold)
    }

    range = body.findText(pattern, range);
  }
}

function order2Str(order) {
  if (!order) return '';
  return (
    ((order['printed'] === true || order['printed'] === 'TRUE') ? '' : 'NEW\n') +
    lineIf(order, ['paid'], {overrides: [function(val) {return ((val === true || val === 'TRUE') ? 'Paid' : 'NOT Paid')}]}) +
    lineIf(order, ['name', 'phone']/*, {prefix: '👨 '}*/) +
    lineIf(order, ['date', 'time']/*, {prefix: '🕐 '}*/) +
    lineIf(order, ['cake', 'size']/*, {prefix: '🎂 '}*/) +
    lineIf(order, ['taste', 'letter']/*, {prefix: '      '}*/) +
    lineIf(order, ['shape', 'color']/*, {prefix: '      '}*/) +
    lineIf(order, ['sentence'], {prefix: '✍️️ '}) +
    lineIf(order, ['order_from', 'social_name']/*, {prefix: '📲 '}*/) +
    lineIf(order, ['delivery_method', 'delivery_address']/*, {prefix: '🚚 '}*/) +
    lineIf(order, ['decorations']) +
    lineIf(order, ['remarks'])
  )
}

function get(row, col) {
  return [].concat(fields[col]).reduce(function(acc, c) {
    var res = row[c] || acc
    if (col === 'time') {
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

  exportOrders({date: date})
}

function exportUnprintedOrdersOfTmwTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 2)

  exportOrders({unprintedOnly: true, date: date})
}

function exportAllOrdersOfTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
                
  exportOrders({date: date})
}

function exportUnprintedOrdersOfTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  
  exportOrders({unprintedOnly: true, date: date})
}

function exportCustomOrders() {
  const [month, day] = Browser.inputBox('Orders Date', 'MM/DD', Browser.Buttons.OK_CANCEL).split('/').map(function(t) {return 0 + t});
  
  exportOrders({date: new Date(new Date().getYear(), month - 1, day)})
}

function exportOrders(filter) {
  filter.paidOnly = true // Print only paid orders for now
  var sheet = SpreadsheetApp.getActiveSheet();
  
  const date = filter.date
  
  const [month, day, year] = [date.getMonth() + 1, date.getDate(), date.getFullYear()]
  const reportName = 'Orders for ' + month + '/' + day + (filter.paidOnly ? ' (Paid)' : ' (All)')
  
  var data = (
    sheet.getDataRange().getValues()
      .map(function(o, index) {o.id = index; return o})
      .filter(function(o) {
        var odate = get(o, 'date') || ''
        if (odate instanceof Date) {
          return odate.getMonth() + 1 == month && odate.getDate() == day
        }
        return (odate.replace('\'', '').trim() == month + '/' + day) || (odate.replace('\'', '').trim() == month + '/' + day + '/' + year)
      })
      .filter(function(o) {return (!filter.unprintedOnly) || !(get(o, 'printed') === 'TRUE' || get(o, 'printed') === true)})
      .filter(function(o) {return (!filter.paidOnly) || typeof get(o, 'paid') === 'string' ? 'TRUE' == get(o, 'paid') : get(o, 'paid') }) // paid
  );
  
  const orders = []

  //Logger.clear();
  data.forEach(function(row) {
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
//    if (order.paid) {
//      sheet.getRange('V' + (row.id + 1)).setValue(true)
//    }
  })
  
  var doc = DocumentApp.create(reportName)

  DocumentApp.getDownload
  
  var body = doc.getBody()
  body.editAsText().setFontSize(21)
  body.setMarginBottom(0); body.setMarginTop(0);
  body.setMarginLeft(0); body.setMarginRight(0);
  var cells = []
  orders.forEach(function(o, i) {
    if (i % 4 != 0) return;
    
    Logger.log(order2Str(orders[i]))
    var table = body.appendTable([
      [order2Str(orders[i]), order2Str(orders[i + 1]) || ''],
      [order2Str(orders[i + 2]) || '', order2Str(orders[i + 3]) || '']
    ])
    body.appendPageBreak()
  })
  
  stylePattern(body, '(NOT )?Paid', {bold: true})
  stylePattern(body, '\d{8}', {bold: true}) // Phone number
  stylePattern(body, '寫名.*', {underline: true})
  
  doc.saveAndClose()
  
  var docRef = DriveApp.getFileById(doc.getId())
  var dailyFolder = DriveApp.getFoldersByName('Daily').next()
  dailyFolder.addFile(docRef)
  DriveApp.removeFile(docRef)
  
  var pdfRef = DriveApp.createFile(doc.getAs('application/pdf'))
  dailyFolder.addFile(pdfRef)
  pdfRef.setName(reportName)
  DriveApp.removeFile(pdfRef)
  
  var html = HtmlService.createHtmlOutput('<a target=\"_blank\" href=\"' + pdfRef.getDownloadUrl().replace('&gd=true','') + '\">Download</a>')
  SpreadsheetApp.getUi()
      .showModalDialog(html, 'Download');
}

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  const tmw = new Date()
  tmw.setDate(tmw.getDate() + 1)
  var tmwTmw = new Date(new Date().setDate(new Date().getDate() + 2));
//  const tmwTmw = new Date()
//  tmwTmw.setDate(tmwTmw.getDate() + 2)
  
  const [month, day] = [tmw.getMonth() + 1, tmw.getDate()] // tomorrow
  const [month1, day1] = [tmwTmw.getMonth() + 1, tmwTmw.getDate()] // tomorrow
  var marbleMenuEntries = [
//    {name: "Export " + month + '/' + (day) + " orders (All)", functionName: "exportAllOrdersOfTmw"},
    {name: "Export " + month + '/' + (day) + " orders (All) (Unprinted)", functionName: "exportUnprintedOrdersOfTmw"},
    {name: "Export " + month1 + '/' + (day1) + " orders (All)", functionName: "exportAllOrdersOfTmwTmw"},
    {name: "Export Custom orders", functionName: "exportCustomOrders"},
    {name: "Increment field", functionName: "autoIncrement"},
  ];
  ss.addMenu("Marble", marbleMenuEntries);
};
    
    function onEdit() {
    autoIncrement();
    }
    
function autoIncrement() {
  var AUTOINC_COLUMN = 100; // Try to make sure not to overlap other columns
  var HEADER_ROW_COUNT = 1;
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var worksheet   = spreadsheet.getActiveSheet();
  var rows        = worksheet.getDataRange().getNumRows();
  var vals        = worksheet.getSheetValues(1, 1, rows+1, 2);
    
  Logger.clear()
  Logger.log(rows)
  Logger.log(vals.toString())
    
  worksheet.getRange(HEADER_ROW_COUNT, AUTOINC_COLUMN+1).setValue('Index')
  
  for (var row = HEADER_ROW_COUNT; row < vals.length; row++) {
    try {
      var id = vals[row][AUTOINC_COLUMN];
//      Logger.log(id);Logger.log((""+id).length ===0);
      if (id === undefined) {
        // Here the columns & rows are 1-indexed
        worksheet.getRange(row+1, AUTOINC_COLUMN+1).setValue(row + 1);
      }
    } catch(ex) {
      // Keep calm and carry on
    }
  }
}
