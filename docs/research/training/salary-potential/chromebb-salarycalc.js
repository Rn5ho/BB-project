// This code is in the public domain.
// As if you care.

console.log("hi");

// Josef Ka's salary formula.

var POSITION_MULTIPLIERS = {
  pg: [1.025, 1.045, 1.080, 1.080, 1.040, 1.155, 1.000, 1.000, 1.035, 1.000],
  sg: [1.125, 1.150, 1.130, 1.000, 1.000, 1.000, 1.000, 1.000, 1.065, 1.000],
  sf: [1.180, 1.085, 1.065, 1.000, 1.000, 1.000, 1.000, 1.060, 1.090, 1.005],
  pf: [1.080, 1.000, 1.000, 1.000, 1.000, 1.000, 1.115, 1.115, 1.115, 1.060],
  c:  [1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.138, 1.135, 1.130, 1.065]
};

var DEFLATION_MODELS = [
  {k: 0.9885151, d: 0.0180707},
  {k: 2.3867857, d: 0.1283662}
];

function computeSalaryJK(skills) {
  var min = function(xs) {
    return Math.min.apply(undefined, xs);
  };

  var max = function(xs) {
    return Math.max.apply(undefined, xs);
  };

  var salaryPerPosition = function(skills, mult) {
    var acc = 0;
    for (var i = 0; i < mult.length; i++) {
      acc += Math.log(mult[i]) * skills[i];
    }
    return 300 * Math.exp(acc);
  };

  var deflate = function(salary) {
    // TODO: Estimate parameters properly at the beginning of
    // the season, and remove the correction factor.
    return 0.86 * min($.map(DEFLATION_MODELS, function(dm) {
      return salary * (dm.k - dm.d * Math.log(salary));
    }));
  };

  var salaries = $.map(POSITION_MULTIPLIERS, function(mult) {
    return Math.round(deflate(salaryPerPosition(skills, mult)));
  });

  return max(salaries);
}


// BB USA salary formula.

function computeSalaryUS(skills) {
  var getSal = function(ratings, coefs) {
    var sal = 1;
    for (i = 0; i<10; i++) {
    sal = sal * Math.pow(coefs[i], ratings[i]);
    }   
    sal = sal * coefs[10];
    return sal;
  };

  var PG = [1.0319, 1.0460, 1.0728, 1.0725, 1.0360, 1.1515, 1.0005, 1.0010, 1.0361, 0.9996, 245];
  var SG = [1.1160, 1.1466, 1.1268, 1.0012, 1.0012, 1.0019, 0.9997, 1.0010, 1.0623, 0.9993, 245];
  var SF = [1.1701, 1.0839, 1.0614, 1.0027, 0.9999, 1.0007, 1.0007, 1.0581, 1.0896, 1.0016, 245];
  var PF = [1.0779, 1.0013, 1.0002, 1.0014, 1.0019, 1.0003, 1.1123, 1.1101, 1.1099, 1.0528, 245];
  var C = [1.0011, 1.0009, 1.0001, 0.9996, 1.0004, 1.0007, 1.1299, 1.1283, 1.1281, 1.0619, 245];
  
  var sals = $.map([PG, SG, SF, PF, C], function(mult) { return getSal(skills, mult); });
  
  var tmpsal = Math.max.apply(null, sals);
  var sal_a = 1.000404;
  var sal_b = 0.001170;
  var sal_c = 9.383502;
  var sal_d = 4.798096;
  var sal_e = -0.000113;

  var logEst = Math.log(tmpsal);
  var adj = (sal_a + sal_b*Math.exp(-Math.pow(logEst - sal_c,2)/(sal_d)))*(1+sal_e*logEst);
  return Math.round(Math.exp(logEst / adj));
}


// Util.

function formatDollars(salary) {
  var digits = String(salary).split('').reverse();
  var zs = $.map(digits, function(d, i) {
    if (i > 0 && i % 3 == 0) {
      return d + ".";
    } else {
      return d;
    }
  });
  return "$ " + zs.reverse().join('').replace('.', '&nbsp;');
}

function showSalary(jk, us) {
  var avg = Math.round((jk + us) / 2000) * 1000;
  return "<b title='JosefKa: "
      + formatDollars(jk)
      + ", US: "
      + formatDollars(us)
      + "'>" + formatDollars(avg)
      + "</b>";
}


var totalSalariesJK = 0;
var totalSalariesUS = 0;

var hasPlayers = false;
var showTotals = true;

$('.oldbox, .widebox').each(function(_, elt) {
  var skills = $('table table:gt(0) tr:lt(5) td', elt)
      .map(function(_, td) { return parseInt($('a', td).prop('title')); })
      .get();
  
  if (!skills.length) { 
    showTotals = false;
    return;
  }

  var salaryJK = computeSalaryJK(skills);
  var salaryUS = computeSalaryUS(skills);

  var salarySnippet = $(
      "<br><br><span class='salarycalc-predicted'>"
      + "Predicted salary: "
      + showSalary(salaryJK, salaryUS)
      + "</span>");
  
  salarySnippet.appendTo($('table table:first td:last', elt));
  
  totalSalariesJK += salaryJK;
  totalSalariesUS += salaryUS;
  hasPlayers = true;
});

if (hasPlayers && showTotals) {
  var salarySnippet = $("<br><br><span class='salarycalc-predicted'>"
      + "Predicted total salaries: <b>"
      + showSalary(totalSalariesJK, totalSalariesUS)
      + "</b></span>");
  salarySnippet.appendTo($('.headline:first'));
}
