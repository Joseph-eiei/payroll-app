import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TABLE_ROW_HEIGHT = 50; // px
const fixedRowClass = 'payroll-fixed-row';

function PayrollHistoryPage() {
  const [cycle, setCycle] = useState('รายเดือน');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [halfPeriod, setHalfPeriod] = useState('1-15');
  const [records, setRecords] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [error, setError] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editInputs, setEditInputs] = useState({
    advance_details: [],
    savings_deposit: 0,
    savings_withdraw: 0,
    savings_remark: '',
    advance_total: 0,
  });

  const fetchHistory = async (m, c, period) => {
    try {
      if (c === 'รายเดือน') {
        const res = await axios.get(`/api/payroll/monthly/history?month=${m}`);
        const sorted = res.data.sort((a, b) => {
          if (a.nationality === 'ไทย' && b.nationality !== 'ไทย') return -1;
          if (a.nationality !== 'ไทย' && b.nationality === 'ไทย') return 1;
          return a.employee_id - b.employee_id;
        });
        setRecords(sorted);
      } else {
        const p = period === '16-สิ้นเดือน' ? 'second' : 'first';
        const res = await axios.get(
          `/api/payroll/semi-monthly/history?month=${m}&period=${p}`,
        );
        const sorted = res.data.sort((a, b) => {
          if (a.nationality === 'ไทย' && b.nationality !== 'ไทย') return -1;
          if (a.nationality !== 'ไทย' && b.nationality === 'ไทย') return 1;
          if (a.employee_id === b.employee_id) {
            return (a.period || '').localeCompare(b.period || '');
          }
          return a.employee_id - b.employee_id;
        });
        setRecords(sorted);
      }
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูล');
    }
  };

  useEffect(() => {
    fetchHistory(month, cycle, halfPeriod);
  }, [cycle, month, halfPeriod]);

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const { data } = await axios.get('/api/deductions/types');
        setDeductionTypes(data.filter((t) => t.is_active));
      } catch (err) {
        console.error(err);
      }
    };
    loadTypes();
  }, []);

  const computeValues = (rec, inputs, includeDeduction = true) => {
    const days = parseFloat(inputs.days_worked) || 0;
    const hours = parseFloat(inputs.hours_worked) || 0;
    const bonus = parseFloat(inputs.bonus_count) || 0;
    const ot = parseFloat(inputs.ot_hours) || 0;
    const sun = parseFloat(inputs.sunday_days) || 0;
    const daily = parseFloat(rec.daily_wage || 0);
    const basePay = days * daily + hours * (daily / 8) + bonus * 50;
    const otPay = ot * ((daily / 8) * 1.5);
    const sunPay = sun * (daily * 1.5);

    let otherBaseOt = 0;
    if (
      rec.period === 'second' &&
      rec.deduction_details &&
      rec.deduction_details.length > 0 &&
      deductionTypes.length > 0
    ) {
      const d0 = rec.deduction_details[0];
      const t0 = deductionTypes.find((d) => d.name === d0.name);
      if (t0 && parseFloat(t0.rate) > 0) {
        const monthlyBase = d0.amount / (parseFloat(t0.rate) / 100);
        const currentBase = parseFloat(rec.base_pay || 0) + parseFloat(rec.ot_pay || 0);
        otherBaseOt = monthlyBase - currentBase;
      }
    }

    const advTotal =
      inputs.advance_details && inputs.advance_details.length > 0
        ? inputs.advance_details.reduce(
            (sum, a) => sum + (parseFloat(a.amount) || 0),
            0,
          )
        : parseFloat(inputs.advance_total || rec.advance_total || 0);
    const savingsDep =
      inputs.savings_deposit !== undefined
        ? parseFloat(inputs.savings_deposit) || 0
        : rec.savings_deposit || 0;
    const savingsWd =
      inputs.savings_withdraw !== undefined
        ? parseFloat(inputs.savings_withdraw) || 0
        : rec.savings_withdraw || 0;
    const totalIncome = basePay + otPay + sunPay + savingsWd;
    const baseForDeduction = basePay + otPay + otherBaseOt;
    let dedType = 0;
    deductionTypes.forEach((d) => {
      dedType += (baseForDeduction * (parseFloat(d.rate) || 0)) / 100;
    });
    const otherDed = dedType + advTotal + savingsDep;
    const deductionsTotal =
      (parseFloat(rec.water_deduction) || 0) +
      (parseFloat(rec.electric_deduction) || 0) +
      otherDed;
    const netPay = totalIncome - (includeDeduction ? deductionsTotal : 0);
    const details = deductionTypes.map((d) => ({
      name: d.name,
      amount: (baseForDeduction * (parseFloat(d.rate) || 0)) / 100,
    }));
    return {
      basePay,
      otPay,
      sunPay,
      totalIncome,
      deductionsTotal,
      netPay,
      details,
    };
  };

  const renderIncomeHeader = () => (
    <tr className="bg-gray-100">
      <th className="px-2 py-2 text-left">ชื่อพนักงาน</th>
      <th className="px-2 py-2">ค่าแรง/วัน</th>
      <th className="px-2 py-2">วัน</th>
      <th className="px-2 py-2">ชั่วโมง</th>
      <th className="px-2 py-2">เบี้ยขยัน</th>
      <th className="px-2 py-2">ค่าแรงรวม</th>
      <th className="px-2 py-2">OT/ชม.</th>
      <th className="px-2 py-2">ชม. OT</th>
      <th className="px-2 py-2">ค่า OT</th>
      <th className="px-2 py-2">ค่าแรง/วันอาทิตย์</th>
      <th className="px-2 py-2">อาทิตย์(วัน)</th>
      <th className="px-2 py-2">ค่าแรงวันอาทิตย์</th>
      <th className="px-2 py-2">รวมรายได้</th>
      <th colSpan={10} />
    </tr>
  );

  const renderDeductionHeader = (showDeduction) => (
    <tr className="bg-gray-100">
      {showDeduction && (
        <>
          <th className="px-2 py-2">ค่าน้ำ</th>
          <th className="px-2 py-2">ค่าไฟ</th>
          {deductionTypes.map((d) => (
            <th key={d.id} className="px-2 py-2">
              {`${d.name} (${parseFloat(d.rate)}%)`}
            </th>
          ))}
          <th className="px-2 py-2">เงินเบิก</th>
          <th className="px-2 py-2">เงินเก็บสะสม</th>
          <th className="px-2 py-2">รวมยอดหัก</th>
          <th colSpan={12} />
        </>
      )}
    </tr>
  );

  const renderNetHeader = () => (
    <tr className="bg-gray-100">
      <th className="px-2 py-2">รับสุทธิ</th>
      <th colSpan={20} />
    </tr>
  );

  const renderPayrollTable = (data, showDeduction = true) => (
    <table className="min-w-full bg-white shadow rounded text-sm border border-gray-300">
      <style>
        {`
          .${fixedRowClass} {
            height: ${TABLE_ROW_HEIGHT}px;
            min-height: ${TABLE_ROW_HEIGHT}px;
          }
          .payroll-bordered th, .payroll-bordered td {
            border: 1px solid #d1d5db;
          }
        `}
      </style>
      <tbody className="payroll-bordered">
        {data.map((p, idx) => {
          const key = `${p.employee_id}-${p.period || 'm'}`;
          const isEdit = editingKey === key;
          const vals = isEdit ? computeValues(p, editInputs, showDeduction) : {};
          return (
            <React.Fragment key={key}>
              {(idx === 0 || p.nationality !== data[idx - 1].nationality) && (
                <tr className="bg-blue-100">
                  <td colSpan={100} className="px-2 py-1 font-semibold text-left">
                    {p.nationality === 'ไทย' ? 'คนไทย' : 'ต่างชาติ'}
                  </td>
                </tr>
              )}
              {renderIncomeHeader()}
              <tr className={`border-t ${fixedRowClass}`}>
                <td rowSpan="5" className="px-2 py-1">
                  <div className='mb-1'>{`${p.first_name} ${p.last_name}${p.nickname ? `(${p.nickname})` : ''}`}</div>
                  {p.bank_name && p.bank_account_number && (
                    <div className="text-xs text-gray-500">
                      <div>{p.bank_name}</div>
                      <div>{p.bank_account_number}</div>
                      {p.bank_account_name && <div>{p.bank_account_name}</div>}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1 text-center">
                  {parseFloat(p.daily_wage).toFixed(2)}
                </td>
                <td className="px-2 py-1 text-center">
                  {isEdit ? (
                    <input
                      type="number"
                      className="border w-16 p-1"
                      value={editInputs.days_worked}
                      onChange={(e) => setEditInputs({ ...editInputs, days_worked: e.target.value })}
                    />
                  ) : (
                    p.days_worked
                  )}
                </td>
                <td className="px-2 py-1 text-center">
                  {isEdit ? (
                    <input
                      type="number"
                      className="border w-16 p-1"
                      value={editInputs.hours_worked}
                      onChange={(e) => setEditInputs({ ...editInputs, hours_worked: e.target.value })}
                    />
                  ) : (
                    p.hours_worked
                  )}
                </td>
                <td className="px-2 py-1 text-center">
                  {isEdit ? (
                    <input
                      type="number"
                      className="border w-12 p-1"
                      value={editInputs.bonus_count}
                      onChange={(e) => setEditInputs({ ...editInputs, bonus_count: e.target.value })}
                    />
                  ) : (
                    p.bonus_count
                  )}
                </td>
                <td className="px-2 py-1 text-center">
                  {isEdit ? vals.basePay.toFixed(2) : Number(p.base_pay).toFixed(2)}
                </td>
                <td className="px-2 py-1 text-center">
                  {((parseFloat(p.daily_wage) / 8) * 1.5).toFixed(2)}
                </td>
                <td className="px-2 py-1 text-center">
                  {isEdit ? (
                    <input
                      type="number"
                      className="border w-16 p-1"
                      value={editInputs.ot_hours}
                      onChange={(e) => setEditInputs({ ...editInputs, ot_hours: e.target.value })}
                    />
                  ) : (
                    p.ot_hours
                  )}
                </td>
                <td className="px-2 py-1 text-center">
                  {isEdit ? vals.otPay.toFixed(2) : Number(p.ot_pay).toFixed(2)}
                </td>
                <td className="px-2 py-1 text-center">
                  {(parseFloat(p.daily_wage) * 1.5).toFixed(2)}
                </td>
                <td className="px-2 py-1 text-center">
                  {isEdit ? (
                    <input
                      type="number"
                      className="border w-16 p-1"
                      value={editInputs.sunday_days}
                      onChange={(e) => setEditInputs({ ...editInputs, sunday_days: e.target.value })}
                    />
                  ) : (
                    p.sunday_days
                  )}
                </td>
                <td className="px-2 py-1 text-center">
                  {isEdit ? vals.sunPay.toFixed(2) : Number(p.sunday_pay).toFixed(2)}
                </td>
                <td className="px-2 py-1 text-center text-green-800 font-bold">
                  {isEdit ? vals.totalIncome.toFixed(2) : Number(p.total_income).toFixed(2)}
                </td>
              </tr>
              {renderDeductionHeader(showDeduction)}
              {showDeduction && (
                <tr className={fixedRowClass}>
                  <>
                    <td className="px-2 py-1 text-center">
                      {Number(p.water_deduction).toFixed(2)}
                    </td>
                    <td className="px-2 py-1 text-center">
                      {Number(p.electric_deduction).toFixed(2)}
                    </td>
                    {deductionTypes.map((d) => {
                      const detail = isEdit
                        ? vals.details.find((dd) => dd.name === d.name)
                        : p.deduction_details?.find((dd) => dd.name === d.name);
                      return (
                        <td key={`${key}-${d.id}`} className="px-2 py-1 text-center">
                          {detail ? Number(detail.amount).toFixed(2) : '0.00'}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 text-center">
                      {isEdit ? (
                        p.advance_details?.length > 0 || p.advance_total > 0 ? (
                          <div className="space-y-1">
                            {editInputs.advance_details.length > 0 ? (
                              editInputs.advance_details.map((a, idx) => (
                                <div key={a.tx_id} className="flex items-center space-x-1">
                                  <span className="whitespace-nowrap">{a.name}</span>
                                  <input
                                    type="number"
                                    className="border w-16 p-1"
                                    value={a.amount}
                                    onChange={(e) => {
                                      const list = [...editInputs.advance_details];
                                      list[idx].amount = e.target.value;
                                      setEditInputs({ ...editInputs, advance_details: list });
                                    }}
                                  />
                                  <input
                                    type="text"
                                    className="border p-1"
                                    value={a.remark || ''}
                                    onChange={(e) => {
                                      const list = [...editInputs.advance_details];
                                      list[idx].remark = e.target.value;
                                      setEditInputs({ ...editInputs, advance_details: list });
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    คงเหลือ {Number(a.remaining).toFixed(2)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <input
                                type="number"
                                className="border w-20 p-1"
                                value={editInputs.advance_total || 0}
                                onChange={(e) => setEditInputs({ ...editInputs, advance_total: e.target.value })}
                              />
                            )}
                          </div>
                        ) : (
                          '-'
                        )
                      ) : p.advance_details && p.advance_details.length > 0 ? (
                        <div className="space-y-1">
                          {p.advance_details.map((a, idx) => (
                            <div key={idx} className="whitespace-nowrap">
                              {`${idx + 1}. ${a.name} หักเพิ่ม ${Number(a.amount).toLocaleString()} คงเหลือ ${Number(a.remaining).toFixed(2)}`}
                              {a.remark && ` หมายเหตุ: ${a.remark}`}
                            </div>
                          ))}
                        </div>
                      ) : p.advance_total > 0 ? (
                        Number(p.advance_total).toFixed(2)
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-2 py-1 text-center">
                      {isEdit ? (
                        <div className="flex space-x-1">
                          {editInputs.savings_withdraw > 0 ? (
                            <input
                              type="number"
                              placeholder="ถอน"
                              className="border w-16 p-1"
                              value={editInputs.savings_withdraw}
                              onChange={(e) =>
                                setEditInputs({ ...editInputs, savings_withdraw: e.target.value })
                              }
                            />
                          ) : (
                            <input
                              type="number"
                              placeholder="ฝาก"
                              className="border w-16 p-1"
                              value={editInputs.savings_deposit}
                              onChange={(e) =>
                                setEditInputs({ ...editInputs, savings_deposit: e.target.value })
                              }
                            />
                          )}
                          <input
                            type="text"
                            placeholder="หมายเหตุ"
                            className="border p-1"
                            value={editInputs.savings_remark}
                            onChange={(e) => setEditInputs({ ...editInputs, savings_remark: e.target.value })}
                          />
                        </div>
                      ) : (
                        <>
                          {p.savings_deposit > 0 && `ฝาก ${Number(p.savings_deposit).toFixed(2)}`}
                          {p.savings_withdraw > 0 && `ถอน ${Number(p.savings_withdraw).toFixed(2)}`}
                          {p.savings_deposit === 0 && p.savings_withdraw === 0 && '-'}
                          {p.savings_remark && ` หมายเหตุ: ${p.savings_remark}`}
                        </>
                      )}
                    </td>
                    <td className="px-2 py-1 text-center text-red-800 font-bold">
                      {isEdit ? vals.deductionsTotal.toFixed(2) : Number(p.deductions_total).toFixed(2)}
                    </td>
                  </>
                </tr>
              )}
              {renderNetHeader()}
              <tr className={fixedRowClass}>
                <td className="px-2 py-1 text-center font-bold">
                  {isEdit ? vals.netPay.toFixed(2) : Number(p.net_pay).toFixed(2)}
                </td>
                <td className="px-2 py-1 text-center">
                  {isEdit ? (
                    <>
                      <button
                        onClick={async () => {
                          try {
                            const payload = {
                              days_worked: editInputs.days_worked,
                              hours_worked: editInputs.hours_worked,
                              bonus_count: editInputs.bonus_count,
                              ot_hours: editInputs.ot_hours,
                              sunday_days: editInputs.sunday_days,
                              advance_updates: editInputs.advance_details.map((a) => ({
                                tx_id: a.tx_id,
                                advance_id: a.advance_id,
                                amount: a.amount,
                                remark: a.remark,
                              })),
                              savings_deposit: editInputs.savings_deposit,
                              savings_withdraw: editInputs.savings_withdraw,
                              savings_remark: editInputs.savings_remark,
                            };
                            if (cycle === 'รายเดือน') {
                              await axios.put(`/api/payroll/monthly/history/${p.id}`, payload);
                            } else {
                              await axios.put(`/api/payroll/semi-monthly/history/${p.id}`, payload);
                            }
                            setEditingKey(null);
                            fetchHistory(month, cycle, halfPeriod);
                          } catch (err) {
                            console.error(err);
                            alert('บันทึกไม่สำเร็จ');
                          }
                        }}
                        className="bg-green-500 text-white px-2 py-1 mr-1 rounded"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="bg-gray-300 px-2 py-1 rounded text-red-500"
                      >
                        ยกเลิก
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingKey(key);
                        setEditInputs({
                          days_worked: p.days_worked,
                          hours_worked: p.hours_worked,
                          bonus_count: p.bonus_count,
                          ot_hours: p.ot_hours,
                          sunday_days: p.sunday_days,
                          advance_details: p.advance_details ? p.advance_details.map((a) => ({ ...a })) : [],
                          savings_deposit: p.savings_deposit,
                          savings_withdraw: p.savings_withdraw,
                          savings_remark: p.savings_remark || '',
                          advance_total: p.advance_total || 0,
                        });
                      }}
                      className="text-blue-500"
                    >
                      แก้ไข
                    </button>
                  )}
                </td>
              </tr>
              {!showDeduction && <tr />}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="p-6 text-black space-y-6">
      <h2 className="text-2xl font-semibold">ประวัติเงินเดือน</h2>
      {error && <div className="text-red-600">{error}</div>}
      <div className="mb-4">
        <label className="mr-2 font-semibold">รอบจ่าย</label>
        <select value={cycle} onChange={(e) => setCycle(e.target.value)} className="border p-2">
          <option value="รายเดือน">รายเดือน</option>
          <option value="ครึ่งเดือน">ครึ่งเดือน</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="mr-2 font-semibold">เดือน</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border p-2"
        />
      </div>
      {cycle === 'ครึ่งเดือน' && (
        <div className="mb-4">
          <label className="mr-2 font-semibold">รอบ</label>
          <select
            value={halfPeriod}
            onChange={(e) => setHalfPeriod(e.target.value)}
            className="border p-2"
          >
            <option value="1-15">1-15</option>
            <option value="16-สิ้นเดือน">16-สิ้นเดือน</option>
          </select>
        </div>
      )}
      {records.length > 0 ? (
        renderPayrollTable(records, cycle === 'รายเดือน' || halfPeriod === '16-สิ้นเดือน')
      ) : (
        <p className="text-red-500">ไม่พบข้อมูล</p>
      )}
    </div>
  );
}

export default PayrollHistoryPage;
