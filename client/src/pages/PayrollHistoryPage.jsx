import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PayrollHistoryPage() {
  const [cycle, setCycle] = useState('รายเดือน');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [records, setRecords] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [error, setError] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editInputs, setEditInputs] = useState({
    advance_details: [],
    savings_deposit: 0,
    savings_withdraw: 0,
    advance_total: 0,
  });

  const fetchHistory = async (m, c) => {
    try {
      if (c === 'รายเดือน') {
        const res = await axios.get(`/api/payroll/monthly/history?month=${m}`);
        setRecords(res.data);
      } else {
        const res = await axios.get(`/api/payroll/semi-monthly/history?month=${m}`);
        setRecords(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูล');
    }
  };

  useEffect(() => {
    fetchHistory(month, cycle);
  }, [cycle, month]);

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

  const computeValues = (rec, inputs) => {
    const days = parseFloat(inputs.days_worked) || 0;
    const hours = parseFloat(inputs.hours_worked) || 0;
    const bonus = parseFloat(inputs.bonus_count) || 0;
    const ot = parseFloat(inputs.ot_hours) || 0;
    const sun = parseFloat(inputs.sunday_days) || 0;
    const daily = parseFloat(rec.daily_wage || 0);
    const basePay = days * daily + hours * (daily / 8) + bonus * 50;
    const otPay = ot * ((daily / 8) * 1.5);
    const sunPay = sun * (daily * 1.5);
    const advTotal =
      inputs.advance_details && inputs.advance_details.length > 0
        ? inputs.advance_details.reduce(
            (sum, a) => sum + (parseFloat(a.amount) || 0),
            0
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
    let dedType = 0;
    deductionTypes.forEach((d) => {
      dedType += ((basePay + otPay) * (parseFloat(d.rate) || 0)) / 100;
    });
    const otherDed = dedType + advTotal + savingsDep;
    const deductionsTotal =
      (parseFloat(rec.water_deduction) || 0) +
      (parseFloat(rec.electric_deduction) || 0) +
      otherDed;
    const netPay = totalIncome - deductionsTotal;
    const details = deductionTypes.map((d) => ({
      name: d.name,
      amount: ((basePay + otPay) * (parseFloat(d.rate) || 0)) / 100,
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

  const renderHeader = (showPeriod = false) => (
    <>
      <tr className="bg-gray-100">
        <th rowSpan="2" className="px-2 py-2">รหัส</th>
        <th rowSpan="2" className="px-2 py-2 text-left">ชื่อพนักงาน</th>
        {showPeriod && <th rowSpan="2" className="px-2 py-2">รอบ</th>}
        <th rowSpan="2" className="px-2 py-2">รายการ</th>
        <th colSpan="9" className="px-2 py-2 text-center">รายได้</th>
        <th colSpan={5 + deductionTypes.length} className="px-2 py-2 text-center">รายหัก</th>
        <th rowSpan="2" className="px-2 py-2">รับสุทธิ</th>
      </tr>
      <tr className="bg-gray-100">
        <th className="px-2 py-2">วันทำงาน</th>
        <th className="px-2 py-2">ชั่วโมง</th>
        <th className="px-2 py-2">เบี้ยขยัน</th>
        <th className="px-2 py-2">ค่าแรงรวม</th>
        <th className="px-2 py-2">OT(ชม.)</th>
        <th className="px-2 py-2">ค่า OT</th>
        <th className="px-2 py-2">อาทิตย์(วัน)</th>
        <th className="px-2 py-2">ค่าอาทิตย์</th>
        <th className="px-2 py-2">รวมรายได้</th>
        <th className="px-2 py-2">ค่าน้ำ</th>
        <th className="px-2 py-2">ค่าไฟ</th>
        {deductionTypes.map((d) => (
          <th key={d.id} className="px-2 py-2">{`${d.name} (${parseFloat(d.rate)}%)`}</th>
        ))}
        <th className="px-2 py-2">เงินเบิก</th>
        <th className="px-2 py-2">เงินเก็บสะสม</th>
        <th className="px-2 py-2">รวมยอดหัก</th>
      </tr>
    </>
  );

  const renderTable = () => (
    <table className="min-w-full bg-white shadow rounded text-sm">
      <tbody>
        {records.map((p) => {
          const key = `${p.employee_id}-${p.period || 'm'}`;
          const isEdit = editingKey === key;
          const vals = isEdit ? computeValues(p, editInputs) : {};
          return (
            <React.Fragment key={key}>
              {renderHeader(cycle === 'ครึ่งเดือน')}
              <tr className="border-t">
                <td rowSpan="3" className="px-2 py-1 text-center">{p.employee_id}</td>
                <td rowSpan="3" className="px-2 py-1">
                  <div>{`${p.first_name} ${p.last_name}`}</div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {p.bank_account_name || '-'} {p.bank_account_number || ''} {p.bank_name || ''}
                  </div>
                </td>
                {cycle === 'ครึ่งเดือน' && (
                  <td rowSpan="3" className="px-2 py-1 text-center">
                    {p.period === 'first' ? '1-15' : '16-สิ้นเดือน'}
                  </td>
                )}
                <td className="px-2 py-1 font-semibold text-center bg-gray-50">รายได้</td>
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
                <td className="px-2 py-1 text-right">{isEdit ? vals.basePay.toFixed(2) : Number(p.base_pay).toFixed(2)}</td>
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
                <td className="px-2 py-1 text-right">{isEdit ? vals.otPay.toFixed(2) : Number(p.ot_pay).toFixed(2)}</td>
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
                <td className="px-2 py-1 text-right">{isEdit ? vals.sunPay.toFixed(2) : Number(p.sunday_pay).toFixed(2)}</td>
                <td className="px-2 py-1 text-right">{isEdit ? vals.totalIncome.toFixed(2) : Number(p.total_income).toFixed(2)}</td>
                {(
                  <>
                    <td className="px-2 py-1" />
                    <td className="px-2 py-1" />
                    {deductionTypes.map((d) => (
                      <td key={`${key}-${d.id}-blank`} className="px-2 py-1" />
                    ))}
                    <td className="px-2 py-1" />
                    <td className="px-2 py-1" />
                    <td className="px-2 py-1" />
                  </>
                )}
                <td className="px-2 py-1" />
              </tr>
              <tr>
                <td className="px-2 py-1 font-semibold text-center bg-gray-50">รายการหัก</td>
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1 text-right">{Number(p.water_deduction).toFixed(2)}</td>
                <td className="px-2 py-1 text-right">{Number(p.electric_deduction).toFixed(2)}</td>
                {deductionTypes.map((d) => {
                  const detail = isEdit
                    ? vals.details.find((dd) => dd.name === d.name)
                    : p.deduction_details?.find((dd) => dd.name === d.name);
                  return (
                    <td key={`${key}-${d.id}`} className="px-2 py-1 text-right">
                      {detail ? Number(detail.amount).toFixed(2) : '0.00'}
                    </td>
                  );
                })}
                <td className="px-2 py-1">
                  {isEdit ? (
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
                  ) : p.advance_details && p.advance_details.length > 0 ? (
                    <div className="space-y-1">
                      {p.advance_details.map((a, idx) => (
                        <div key={idx} className="whitespace-nowrap">
                          {`${idx + 1}. ${a.name} หักเพิ่ม ${Number(a.amount).toLocaleString()} คงเหลือ ${Number(a.remaining).toFixed(2)}`}
                        </div>
                      ))}
                    </div>
                  ) : (
                    Number(p.advance_total || 0).toFixed(2)
                  )}
                </td>
                <td className="px-2 py-1 text-right">
                  {isEdit ? (
                    <div className="flex space-x-1">
                      <input
                        type="number"
                        placeholder="ฝาก"
                        className="border w-16 p-1"
                        value={editInputs.savings_deposit}
                        onChange={(e) =>
                          setEditInputs({ ...editInputs, savings_deposit: e.target.value })
                        }
                      />
                      <input
                        type="number"
                        placeholder="ถอน"
                        className="border w-16 p-1"
                        value={editInputs.savings_withdraw}
                        onChange={(e) =>
                          setEditInputs({ ...editInputs, savings_withdraw: e.target.value })
                        }
                      />
                    </div>
                  ) : (
                    <>
                      {p.savings_deposit > 0 && `ฝาก ${Number(p.savings_deposit).toFixed(2)}`}
                      {p.savings_withdraw > 0 && `ถอน ${Number(p.savings_withdraw).toFixed(2)}`}
                      {p.savings_deposit === 0 && p.savings_withdraw === 0 && '-'}
                    </>
                  )}
                </td>
                <td className="px-2 py-1 text-right">{isEdit ? vals.deductionsTotal.toFixed(2) : Number(p.deductions_total).toFixed(2)}</td>
                <td className="px-2 py-1" />
              </tr>
              <tr>
                <td className="px-2 py-1 font-semibold text-center bg-gray-50">รับสุทธิ</td>
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                <td className="px-2 py-1" />
                {(
                  <>
                    <td className="px-2 py-1" />
                    <td className="px-2 py-1" />
                    {deductionTypes.map((d) => (
                      <td key={`${key}-${d.id}-empty`} className="px-2 py-1" />
                    ))}
                    <td className="px-2 py-1" />
                    <td className="px-2 py-1" />
                    <td className="px-2 py-1" />
                  </>
                )}
                <td className="px-2 py-1 text-right">{isEdit ? vals.netPay.toFixed(2) : Number(p.net_pay).toFixed(2)}</td>
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
                              })),
                              savings_deposit: editInputs.savings_deposit,
                              savings_withdraw: editInputs.savings_withdraw,
                            };
                            if (cycle === 'รายเดือน') {
                              await axios.put(`/api/payroll/monthly/history/${p.id}`, payload);
                            } else {
                              await axios.put(`/api/payroll/semi-monthly/history/${p.id}`, payload);
                            }
                            setEditingKey(null);
                            fetchHistory(month, cycle);
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
                        className="bg-gray-300 px-2 py-1 rounded"
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
                          advance_details: p.advance_details
                            ? p.advance_details.map((a) => ({ ...a }))
                            : [],
                          savings_deposit: p.savings_deposit,
                          savings_withdraw: p.savings_withdraw,
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
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border p-2" />
      </div>
      {records.length > 0 ? renderTable() : <p className="text-red-500">ไม่พบข้อมูล</p>}
    </div>
  );
}

export default PayrollHistoryPage;
