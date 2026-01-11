import { Order } from '@/types';
import { format } from 'date-fns';

export function generateOrderPDF(order: Order) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita popups para gerar o contrato.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Contrato de Locação - ${order.code}</title>
      <style>
        body { font-family: Helvetica, Arial, sans-serif; padding: 40px; }
        .header { text-align: center; color: #FF6B6B; }
        .title { text-align: center; font-size: 1.2em; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; font-size: 1.1em; margin-bottom: 10px; background: #f5f5f5; padding: 5px; }
        .row { display: flex; margin-bottom: 5px; }
        .label { font-weight: bold; width: 150px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .total { text-align: right; font-weight: bold; font-size: 1.2em; margin-top: 20px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
        .signature-line { border-top: 1px solid #000; width: 40%; text-align: center; padding-top: 10px; }
        .terms { font-size: 0.8em; margin-top: 30px; }
        @media print {
          body { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Cerejas Festas & Locações</h1>
      </div>
      <div class="title">Contrato de Locação - ${order.code}</div>

      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="row"><span class="label">Nome:</span> ${order.client_name}</div>
      </div>

      <div class="section">
        <div class="section-title">Detalhes da Locação</div>
        <div class="row"><span class="label">Tipo de Festa:</span> ${order.party_type}</div>
        <div class="row"><span class="label">Retirada:</span> ${order.pickup_date ? format(new Date(order.pickup_date), 'dd/MM/yyyy') : '-'}</div>
        <div class="row"><span class="label">Devolução:</span> ${order.return_date ? format(new Date(order.return_date), 'dd/MM/yyyy') : '-'}</div>
        <div class="row"><span class="label">Pagamento:</span> ${order.payment_method}</div>
      </div>

      <div class="section">
        <div class="section-title">Itens Locados</div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qtd</th>
              <th>Valor Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.item_name}</td>
                <td>${item.quantity}</td>
                <td>R$ ${item.unit_value.toFixed(2)}</td>
                <td>R$ ${item.total_value.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          VALOR TOTAL: R$ ${order.total_value.toFixed(2)}
        </div>
      </div>

      <div class="signatures">
        <div class="signature-line">Assinatura do Cliente</div>
        <div class="signature-line">Cerejas Festas & Locações</div>
      </div>

      <div class="terms">
        <p><strong>CONTRATO DE LOCAÇÃO DE MATERIAIS PARA FESTAS</strong></p>
        <p>Pelo presente instrumento, a Cerejas Festas e Locações, doravante denominada LOCADORA, e o cliente identificado no ato da contratação, doravante denominado CONTRATANTE, acordam as seguintes cláusulas:</p>
        
        <p><strong>1. DO PRAZO DE LOCAÇÃO</strong><br>
        1.1. O prazo de locação é de 02 (dois) dias úteis, contados a partir da data de retirada do material.<br>
        1.2. Após esse prazo, será cobrada diária adicional por peça, acrescida de multa de 50% sobre o valor total da locação.</p>

        <p><strong>2. DO PAGAMENTO</strong><br>
        2.1. O pagamento total da locação deverá ser efetuado no ato da contratação, não sendo permitida a retirada do material sem a quitação integral.</p>

        <p><strong>3. DO FRETE (ENTREGA E RECOLHIMENTO)</strong><br>
        3.1. Caso o CONTRATANTE opte pelo serviço de frete, o valor será cobrado conforme a localização da entrega e recolhimento, de acordo com a tabela vigente da LOCADORA.</p>

        <p><strong>4. DA RESPONSABILIDADE SOBRE AS PEÇAS</strong><br>
        4.1. O CONTRATANTE é integralmente responsável pelos itens locados, desde a retirada até a devolução.<br>
        4.2. Em caso de extravio, dano ou quebra, o CONTRATANTE deverá optar por uma das seguintes alternativas:<br>
        a) Reposição por peça nova, de mesma especificação, modelo e cor; ou<br>
        b) Pagamento do valor integral da peça, incluindo custos de reposição e frete.<br>
        4.3. Caso a peça faça parte de um conjunto, e não seja possível repor apenas uma unidade, o CONTRATANTE ficará responsável pela reposição de todo o conjunto.</p>

        <p><strong>5. DA DEVOLUÇÃO E MULTAS</strong><br>
        5.1. O valor referente à reposição de peças extraviadas, danificadas ou quebradas deverá ser pago no momento da devolução.<br>
        5.2. A não devolução das peças configura apropriação indébita, sujeitando o CONTRATANTE às penalidades legais.<br>
        5.3. Caso as peças sejam devolvidas sujas, arranhadas ou com pequenas avarias, a LOCADORA poderá cobrar até 20% do valor da peça, a título de manutenção.</p>

        <p><strong>6. DO ESTADO DAS PEÇAS</strong><br>
        6.1. A LOCADORA compromete-se a entregar as peças em perfeito estado de uso e conservação.<br>
        6.2. Caso alguma peça reservada não esteja disponível por quebra, dano ou extravio, a LOCADORA deverá:<br>
        a) Substituí-la por outra de igual valor; ou<br>
        b) Reembolsar o valor correspondente.</p>

        <p><strong>7. DAS PROIBIÇÕES</strong><br>
        7.1. É expressamente proibido ao CONTRATANTE vender, transferir, ceder, emprestar ou sublocar os itens locados.</p>

        <p><strong>8. DO CANCELAMENTO</strong><br>
        8.1. O CONTRATANTE poderá cancelar a reserva sem ônus, desde que o faça com até 7 (sete) dias de antecedência da data de retirada.<br>
        8.2. Após esse prazo, será cobrada multa de 50% do valor total, em razão da indisponibilidade das peças.<br>
        8.3. Cancelamentos realizados com menos de 24 horas da data de retirada implicam cobrança de 100% do valor do contrato, sem direito a reembolso.</p>

        <p><strong>9. DO TRANSPORTE E EMBALAGENS</strong><br>
        9.1. Todo material utilizado para transporte (sacolas, caixas, plásticos, caixotes, entre outros) deverá ser devolvido nas mesmas condições em que foi entregue, sob pena de multa conforme tabela da LOCADORA.</p>

        <p><strong>10. DO FORO</strong><br>
        10.1. Fica eleito o foro da Comarca de Manaus – AM, com renúncia de qualquer outro, por mais privilegiado que seja, para dirimir eventuais dúvidas ou litígios decorrentes deste contrato.</p>

        <p style="margin-top: 20px;"><strong>📌 Declaração Final</strong><br>
        O CONTRATANTE declara estar ciente e de acordo com todas as cláusulas deste contrato, bem como com os valores de reposição das peças locadas.</p>
      </div>

      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
