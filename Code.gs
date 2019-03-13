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
  sentence: 15,
  decorations: 16,
  social_name: 17,
  order_from: 18,
  delivery_method: 19,
  remarks: 20
};

function lineIf(o, fields, opt) {
  const line = (
    fields
    .map(function(f, i) {
      if (opt && opt.overrides && opt.overrides[i]) {
        return opt.overrides[i](o[f])
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
    lineIf(order, ['paid'], {overrides: [function(val) {return ((val === true || val === 'TRUE') ? 'Paid' : 'NOT Paid')}]}) +
    lineIf(order, ['name', 'phone']/*, {prefix: '👨 '}*/) +
    lineIf(order, ['date', 'time']/*, {prefix: '🕐 '}*/) +
    lineIf(order, ['cake', 'size']/*, {prefix: '🎂 '}*/) +
    lineIf(order, ['taste', 'letter']/*, {prefix: '      '}*/) +
    lineIf(order, ['shape', 'color']/*, {prefix: '      '}*/) +
    lineIf(order, ['sentence'], {prefix: '✍️️ '}) +
    lineIf(order, ['order_from', 'social_name']/*, {prefix: '📲 '}*/) +
    lineIf(order, ['delivery_method']/*, {prefix: '🚚 '}*/) +
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

function exportPaidOrdersOfTmwTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 2)

  exportOrders({paidOnly: true, date: date})
}

function exportAllOrdersOfTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
                
  exportOrders({date: date})
}

function exportCustomOrders() {
  const [day, month] = Browser.inputBox('Orders Date', 'DD/MM', Browser.Buttons.OK_CANCEL).split('/').map(function(t) {return 0 + t});
  
  exportOrders({date: new Date(new Date().getYear(), month - 1, day)})
}

function exportOrders(filter) {
  var sheet = SpreadsheetApp.getActiveSheet();
  
  const date = filter.date
  
  const [month, day] = [date.getMonth() + 1, date.getDate()] // day after tomorrow
  const reportName = 'Orders for ' + month + '/' + day + (filter.paidOnly ? ' (Paid)' : ' (All)')
  
  var data = (
    sheet.getDataRange().getValues()
      .map(function(o, index) {o.id = index; return o})
      .filter(function(o) {return get(o, 'date') == month + '/' + day})
//      .filter(function(o) {return (!filter.paidOnly) || filter.paid == get(o, 'paid')}) // paid
  );
  
  const orders = []

  Logger.clear();
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
    sheet.getRange('V' + (row.id + 1)).setValue(true)
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
  stylePattern(body, '\d{8}', {bold: true})
//  stylePattern(body, '蠟燭', {background: '#ff0000'})
//  stylePattern(body, '蠟燭刀叉碟套裝', {background: '#ffffff'})
//  stylePattern(body, '.*(糕|餅)\ \d+.*', {bold: true})
//  stylePattern(body, '生日插牌', {background: '#00ff00'})
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
  const date = new Date()
  date.setDate(date.getDate() + 2)
  
  const [month, day] = [date.getMonth() + 1, date.getDate()] // day after tomorrow
  var marbleMenuEntries = [
    {name: "Export " + month + '/' + (day - 1) + " orders (All)", functionName: "exportAllOrdersOfTmw"},
    {name: "Export " + month + '/' + day + " orders (Paid)", functionName: "exportPaidOrdersOfTmwTmw"},
    {name: "Export Custom orders", functionName: "exportCustomOrders"},
    {name: "Increment field", functionName: "autoIncrement"},
  ];
  ss.addMenu("Marble", marbleMenuEntries);
};
    
function autoIncrement() {
  var AUTOINC_COLUMN = 22; // After printed column
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
