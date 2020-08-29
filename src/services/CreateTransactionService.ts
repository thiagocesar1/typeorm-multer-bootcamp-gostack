import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: string;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError(
        'Invalid type for transaction, please use income or outcome.',
      );
    }

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.total < value) {
      throw new AppError(
        'Your cash balance is insufficient to finish this operation.',
      );
    }

    let categoryFound = await categoryRepository.findOne({
      where: { title: category },
    });
    if (!categoryFound) {
      const categoryCreate = categoryRepository.create({
        title: category,
      });
      categoryFound = await categoryRepository.save(categoryCreate);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: categoryFound,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
